import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsSocialProfileUrl } from 'src/social-account/utils/is-social-profile-url.validator';

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

export class CreateContentCreatorDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL (followers are fetched automatically)',
    example: 'https://www.instagram.com/chris_d/',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @IsSocialProfileUrl('instagram')
  instagramProfileUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether this Instagram account is verified',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  instagramVerified?: boolean;

  @ApiPropertyOptional({
    description: 'TikTok profile URL (followers are fetched automatically)',
    example: 'https://www.tiktok.com/@chris_d',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @IsSocialProfileUrl('tiktok')
  tiktokProfileUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether this TikTok account is verified',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  tiktokVerified?: boolean;
}
