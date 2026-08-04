import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { InstagramProvider } from './providers/instagram.provider';
import { TikTokProvider } from './providers/tiktok.provider';
import {
  extractInstagramUsername,
  extractTikTokUsername,
  formatFollowerCount,
  normalizeInstagramProfileUrl,
  normalizeTikTokProfileUrl,
} from './utils/social-url.util';

export type CreatorSocialUrls = {
  instagramProfileUrl?: string | null;
  tiktokProfileUrl?: string | null;
  instagramVerified?: boolean;
  tiktokVerified?: boolean;
};

@Injectable()
export class SocialAccountService {
  private readonly logger = new Logger(SocialAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramProvider: InstagramProvider,
    private readonly tiktokProvider: TikTokProvider,
  ) {}

  /**
   * Fetch Instagram followers for a profile URL without persisting.
   */
  fetchInstagramFollowers(profileUrl: string) {
    return this.instagramProvider.getFollowers(profileUrl);
  }

  /**
   * Fetch TikTok followers for a profile URL without persisting.
   */
  fetchTikTokFollowers(profileUrl: string) {
    return this.tiktokProvider.getFollowers(profileUrl);
  }

  /**
   * Upsert social accounts from admin-provided profile URLs / verified flags,
   * then sync follower counts. Fetch failures are logged and do not throw.
   */
  async upsertAndSync(
    contentCreatorId: number,
    urls: CreatorSocialUrls,
  ) {
    const creator = await this.prisma.creator.findUnique({
      where: { id: contentCreatorId },
      include: { socialAccounts: true },
    });
    if (!creator) {
      throw new NotFoundException(`Creator ${contentCreatorId} not found`);
    }

    await this.upsertPlatformFromInput(
      contentCreatorId,
      SocialPlatform.INSTAGRAM,
      urls.instagramProfileUrl,
      urls.instagramVerified,
      creator.socialAccounts.find((a) => a.platform === SocialPlatform.INSTAGRAM)
        ?.profileUrl,
    );

    await this.upsertPlatformFromInput(
      contentCreatorId,
      SocialPlatform.TIKTOK,
      urls.tiktokProfileUrl,
      urls.tiktokVerified,
      creator.socialAccounts.find((a) => a.platform === SocialPlatform.TIKTOK)
        ?.profileUrl,
    );

    return this.syncCreatorFollowers(contentCreatorId);
  }

  private async upsertPlatformFromInput(
    contentCreatorId: number,
    platform: SocialPlatform,
    profileUrlInput: string | null | undefined,
    verified: boolean | undefined,
    existingProfileUrl?: string | null,
  ) {
    const trimmed = profileUrlInput?.trim();
    const nextUrl = trimmed
      ? platform === SocialPlatform.INSTAGRAM
        ? normalizeInstagramProfileUrl(trimmed)
        : normalizeTikTokProfileUrl(trimmed)
      : existingProfileUrl ?? null;

    if (!nextUrl && verified === undefined) return;
    if (!nextUrl) return;

    await this.upsertPlatformAccount(
      contentCreatorId,
      platform,
      nextUrl,
      verified,
    );
  }

  /**
   * Re-fetch follower counts for all social accounts linked to a creator.
   */
  async syncCreatorFollowers(contentCreatorId: number) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { contentCreatorId },
    });

    for (const account of accounts) {
      if (!account.profileUrl) {
        this.logger.warn(
          `Skipping ${account.platform} sync for creator ${contentCreatorId}: missing profileUrl`,
        );
        continue;
      }

      await this.syncAccount(account.id, account.platform, account.profileUrl);
    }

    await this.syncDenormalizedCreatorFields(contentCreatorId);

    return this.prisma.socialAccount.findMany({
      where: { contentCreatorId },
      orderBy: { platform: 'asc' },
    });
  }

  /**
   * Sync follower counts for every creator that has at least one social account.
   */
  async syncAllCreators() {
    const creators = await this.prisma.creator.findMany({
      where: { socialAccounts: { some: {} } },
      select: { id: true },
    });

    const results: { contentCreatorId: number; ok: boolean; error?: string }[] =
      [];

    for (const creator of creators) {
      try {
        await this.syncCreatorFollowers(creator.id);
        results.push({ contentCreatorId: creator.id, ok: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown sync error';
        this.logger.error(
          `Failed to sync creator ${creator.id}: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
        results.push({
          contentCreatorId: creator.id,
          ok: false,
          error: message,
        });
      }
    }

    return {
      total: creators.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  private async upsertPlatformAccount(
    contentCreatorId: number,
    platform: SocialPlatform,
    profileUrl: string,
    verified?: boolean,
  ) {
    await this.prisma.socialAccount.upsert({
      where: {
        contentCreatorId_platform: { contentCreatorId, platform },
      },
      create: {
        contentCreatorId,
        platform,
        profileUrl,
        verified: verified ?? false,
      },
      update: {
        profileUrl,
        ...(verified !== undefined ? { verified } : {}),
      },
    });
  }

  private async syncAccount(
    accountId: number,
    platform: SocialPlatform,
    profileUrl: string,
  ) {
    try {
      const snapshot =
        platform === SocialPlatform.INSTAGRAM
          ? await this.fetchInstagramFollowers(profileUrl)
          : await this.fetchTikTokFollowers(profileUrl);

      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          username: snapshot.username,
          profileUrl,
          followers: snapshot.followers,
          lastSyncedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to sync ${platform} account ${accountId}`,
        error instanceof Error ? error.stack : undefined,
      );

      const username =
        platform === SocialPlatform.INSTAGRAM
          ? extractInstagramUsername(profileUrl)
          : extractTikTokUsername(profileUrl);

      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          ...(username ? { username } : {}),
          profileUrl,
          followers: null,
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  /**
   * Keep Creator denormalized username/followers fields in sync for public UI.
   */
  private async syncDenormalizedCreatorFields(contentCreatorId: number) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { contentCreatorId },
    });

    const instagram = accounts.find(
      (a) => a.platform === SocialPlatform.INSTAGRAM,
    );
    const tiktok = accounts.find((a) => a.platform === SocialPlatform.TIKTOK);

    await this.prisma.creator.update({
      where: { id: contentCreatorId },
      data: {
        instagramUsername: instagram?.username ?? null,
        instagramFollowers: formatFollowerCount(instagram?.followers ?? null),
        tiktokUsername: tiktok?.username ?? null,
        tiktokFollowers: formatFollowerCount(tiktok?.followers ?? null),
        // Legacy/creator-level flag: true if any linked platform is verified
        verified: accounts.some((a) => a.verified),
      },
    });
  }
}
