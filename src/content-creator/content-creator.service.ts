import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SocialPlatform } from '@prisma/client';
import { CreateContentCreatorDto } from './dto/create-content-creator.dto';
import { UpdateContentCreatorDto } from './dto/update-content-creator.dto';
import { PreviewFollowersDto } from './dto/preview-followers.dto';
import { PrismaService } from 'src/prisma.service';
import { SocialAccountService } from 'src/social-account/social-account.service';
import {
  formatFollowerCount,
  isInstagramProfileUrl,
  isTikTokProfileUrl,
} from 'src/social-account/utils/social-url.util';
import slugify from 'slugify';

const creatorInclude = {
  socialAccounts: {
    orderBy: { platform: 'asc' as const },
  },
};

@Injectable()
export class ContentCreatorService {
  private readonly logger = new Logger(ContentCreatorService.name);

  constructor(
    private prisma: PrismaService,
    private socialAccountService: SocialAccountService,
  ) {}

  async create(
    createContentCreatorDto: CreateContentCreatorDto,
    profileImage?: string,
  ) {
    const {
      instagramProfileUrl,
      tiktokProfileUrl,
      instagramVerified,
      tiktokVerified,
      ...creatorFields
    } = createContentCreatorDto;

    const slug = slugify(createContentCreatorDto.name, {
      lower: true,
      strict: true,
    });

    const creator = await this.prisma.creator.create({
      data: {
        ...creatorFields,
        profileImage,
        slug,
      },
    });

    if (
      instagramProfileUrl ||
      tiktokProfileUrl ||
      instagramVerified !== undefined ||
      tiktokVerified !== undefined
    ) {
      try {
        await this.socialAccountService.upsertAndSync(creator.id, {
          instagramProfileUrl,
          tiktokProfileUrl,
          instagramVerified,
          tiktokVerified,
        });
      } catch (error) {
        this.logger.error(
          `Social sync failed after creating creator ${creator.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return this.findOne(creator.id);
  }

  findAll() {
    return this.prisma.creator.findMany({
      orderBy: { createdAt: 'desc' },
      include: creatorInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.creator.findUnique({
      where: { slug },
      include: creatorInclude,
    });
  }

  findOne(id: number) {
    return this.prisma.creator.findUnique({
      where: { id },
      include: creatorInclude,
    });
  }

  async update(id: number, updateContentCreatorDto: UpdateContentCreatorDto) {
    const existing = await this.prisma.creator.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Creator ${id} not found`);
    }

    const {
      instagramProfileUrl,
      tiktokProfileUrl,
      instagramVerified,
      tiktokVerified,
      ...creatorFields
    } = updateContentCreatorDto;

    const data: Record<string, unknown> = { ...creatorFields };
    if (creatorFields.name) {
      data.slug = slugify(creatorFields.name, { lower: true, strict: true });
    }

    await this.prisma.creator.update({
      where: { id },
      data,
    });

    const shouldSyncSocial =
      instagramProfileUrl !== undefined ||
      tiktokProfileUrl !== undefined ||
      instagramVerified !== undefined ||
      tiktokVerified !== undefined;

    if (shouldSyncSocial) {
      try {
        await this.socialAccountService.upsertAndSync(id, {
          instagramProfileUrl,
          tiktokProfileUrl,
          instagramVerified,
          tiktokVerified,
        });
      } catch (error) {
        this.logger.error(
          `Social sync failed after updating creator ${id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return this.findOne(id);
  }

  async syncFollowers(id: number) {
    const existing = await this.prisma.creator.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Creator ${id} not found`);
    }

    await this.socialAccountService.syncCreatorFollowers(id);
    return this.findOne(id);
  }

  syncAllFollowers() {
    return this.socialAccountService.syncAllCreators();
  }

  /**
   * Preview follower count for a profile URL without persisting anything.
   * Used by the admin form as the user types/pastes a URL.
   */
  async previewFollowers(dto: PreviewFollowersDto) {
    const profileUrl = dto.profileUrl.trim();

    if (dto.platform === SocialPlatform.INSTAGRAM) {
      if (!isInstagramProfileUrl(profileUrl)) {
        return {
          platform: dto.platform,
          username: null as string | null,
          followers: null as number | null,
          followersLabel: null as string | null,
          error: 'Invalid Instagram profile URL',
        };
      }

      try {
        const snapshot =
          await this.socialAccountService.fetchInstagramFollowers(profileUrl);
        return {
          platform: dto.platform,
          username: snapshot.username,
          followers: snapshot.followers,
          followersLabel: formatFollowerCount(snapshot.followers),
          error: null as string | null,
        };
      } catch (error) {
        this.logger.error(
          `Instagram follower preview failed for ${profileUrl}`,
          error instanceof Error ? error.stack : undefined,
        );
        return {
          platform: dto.platform,
          username: null as string | null,
          followers: null as number | null,
          followersLabel: null as string | null,
          error: 'Could not fetch Instagram followers',
        };
      }
    }

    if (!isTikTokProfileUrl(profileUrl)) {
      return {
        platform: dto.platform,
        username: null as string | null,
        followers: null as number | null,
        followersLabel: null as string | null,
        error: 'Invalid TikTok profile URL',
      };
    }

    try {
      const snapshot =
        await this.socialAccountService.fetchTikTokFollowers(profileUrl);
      return {
        platform: dto.platform,
        username: snapshot.username,
        followers: snapshot.followers,
        followersLabel: formatFollowerCount(snapshot.followers),
        error: null as string | null,
      };
    } catch (error) {
      this.logger.error(
        `TikTok follower preview failed for ${profileUrl}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        platform: dto.platform,
        username: null as string | null,
        followers: null as number | null,
        followersLabel: null as string | null,
        error: 'Could not fetch TikTok followers',
      };
    }
  }

  remove(id: number) {
    return this.prisma.creator.delete({
      where: { id },
    });
  }
}
