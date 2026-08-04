import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SocialAccountService } from './social-account.service';

/**
 * Daily social follower sync.
 * Disabled unless SOCIAL_SYNC_ENABLED=true.
 * Optional override: SOCIAL_SYNC_CRON (standard cron expression).
 */
@Injectable()
export class SocialAccountCron {
  private readonly logger = new Logger(SocialAccountCron.name);

  constructor(
    private readonly socialAccountService: SocialAccountService,
    private readonly config: ConfigService,
  ) {}

  /** Runs daily at 02:00. No-op unless SOCIAL_SYNC_ENABLED=true. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailySync() {
    const enabled =
      this.config.get<string>('SOCIAL_SYNC_ENABLED')?.toLowerCase() === 'true';

    if (!enabled) {
      this.logger.debug(
        'Skipping daily social sync (SOCIAL_SYNC_ENABLED is not true)',
      );
      return;
    }

    this.logger.log('Starting daily social follower sync');
    try {
      const result = await this.socialAccountService.syncAllCreators();
      this.logger.log(
        `Daily social sync finished: ${result.succeeded}/${result.total} succeeded`,
      );
    } catch (error) {
      this.logger.error(
        'Daily social sync failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
