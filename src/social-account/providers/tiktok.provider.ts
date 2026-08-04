import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider } from './social-provider.interface';
import {
  extractTikTokUsername,
  normalizeTikTokProfileUrl,
} from '../utils/social-url.util';

/**
 * TikTok follower provider.
 *
 * Resolution order:
 * 1. External metrics API when SOCIAL_METRICS_API_BASE_URL is set
 *    GET {base}/tiktok/followers?username=...
 * 2. Best-effort public profile scrape
 * 3. Username only with followers: null
 */
@Injectable()
export class TikTokProvider implements SocialProvider {
  private readonly logger = new Logger(TikTokProvider.name);

  constructor(private readonly config: ConfigService) {}

  async getFollowers(profileUrl: string): Promise<{
    username: string;
    followers: number | null;
  }> {
    const username = extractTikTokUsername(profileUrl);
    if (!username) {
      throw new Error(`Invalid TikTok profile URL: ${profileUrl}`);
    }

    const fromApi = await this.fetchFromMetricsApi(username);
    if (fromApi !== undefined) {
      return { username, followers: fromApi };
    }

    const scraped = await this.scrapePublicProfile(username);
    return { username, followers: scraped };
  }

  private async fetchFromMetricsApi(
    username: string,
  ): Promise<number | null | undefined> {
    const baseUrl = this.config.get<string>('SOCIAL_METRICS_API_BASE_URL')?.trim();
    if (!baseUrl) return undefined;

    const apiKey = this.config.get<string>('SOCIAL_METRICS_API_KEY')?.trim();
    const endpoint = `${baseUrl.replace(/\/$/, '')}/tiktok/followers?username=${encodeURIComponent(username)}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        this.logger.warn(
          `TikTok metrics API returned ${response.status} for @${username}`,
        );
        return null;
      }

      const data = (await response.json()) as { followers?: number | null };
      if (typeof data.followers === 'number' && Number.isFinite(data.followers)) {
        return Math.max(0, Math.floor(data.followers));
      }
      return null;
    } catch (error) {
      this.logger.error(
        `TikTok metrics API failed for @${username}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  private async scrapePublicProfile(username: string): Promise<number | null> {
    const url = normalizeTikTokProfileUrl(`https://www.tiktok.com/@${username}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; CDYAgencyBot/1.0; +https://cdyagency.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });

      if (!response.ok) {
        this.logger.warn(
          `TikTok public profile fetch returned ${response.status} for @${username}`,
        );
        return null;
      }

      const html = await response.text();
      return parseTikTokFollowerCount(html);
    } catch (error) {
      this.logger.error(
        `TikTok public profile scrape failed for @${username}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}

/** Exported for unit testing */
export function parseTikTokFollowerCount(html: string): number | null {
  const patterns = [
    /"followerCount"\s*:\s*(\d+)/i,
    /"fans"\s*:\s*(\d+)/i,
    /data-e2e="followers-count"[^>]*>\s*([^<]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    const abbreviated = parseAbbreviatedCount(match[1]);
    if (abbreviated != null) return abbreviated;

    const n = Number(String(match[1]).replace(/[^\d]/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

function parseAbbreviatedCount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  const suffix = match[2];
  if (suffix === 'K') return Math.round(value * 1_000);
  if (suffix === 'M') return Math.round(value * 1_000_000);
  if (suffix === 'B') return Math.round(value * 1_000_000_000);
  return Math.round(value);
}
