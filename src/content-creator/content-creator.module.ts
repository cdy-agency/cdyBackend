import { Module } from '@nestjs/common';
import { ContentCreatorService } from './content-creator.service';
import { ContentCreatorController } from './content-creator.controller';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.config';
import { SocialAccountModule } from 'src/social-account/social-account.module';

@Module({
  imports: [SocialAccountModule],
  controllers: [ContentCreatorController],
  providers: [ContentCreatorService, PrismaService, CloudinaryService],
})
export class ContentCreatorModule {}
