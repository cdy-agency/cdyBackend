import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsModule } from './news/news.module';
import { ContentCreatorModule } from './content-creator/content-creator.module';
import { ContactModule } from './contact/contact.module';
import { SocialAccountModule } from './social-account/social-account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    NewsModule,
    SocialAccountModule,
    ContentCreatorModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
