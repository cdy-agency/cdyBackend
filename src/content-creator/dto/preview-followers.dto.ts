import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SocialPlatform } from '@prisma/client';

export class PreviewFollowersDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform!: SocialPlatform;

  @ApiProperty({
    example: 'https://www.instagram.com/chris_d/',
  })
  @IsString()
  profileUrl!: string;
}
