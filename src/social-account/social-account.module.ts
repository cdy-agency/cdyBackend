import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SocialAccountService } from './social-account.service';
import { SocialAccountCron } from './social-account.cron';
import { InstagramProvider } from './providers/instagram.provider';
import { TikTokProvider } from './providers/tiktok.provider';

@Module({
  providers: [
    PrismaService,
    InstagramProvider,
    TikTokProvider,
    SocialAccountService,
    SocialAccountCron,
  ],
  exports: [SocialAccountService],
})
export class SocialAccountModule {}
