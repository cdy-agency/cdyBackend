import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isInstagramProfileUrl, isTikTokProfileUrl } from './social-url.util';

type SocialUrlPlatform = 'instagram' | 'tiktok';

export function IsSocialProfileUrl(
  platform: SocialUrlPlatform,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSocialProfileUrl',
      target: object.constructor,
      propertyName,
      constraints: [platform],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          return platform === 'instagram'
            ? isInstagramProfileUrl(value)
            : isTikTokProfileUrl(value);
        },
        defaultMessage(args: ValidationArguments) {
          const target = args.constraints[0] as SocialUrlPlatform;
          return target === 'instagram'
            ? 'instagramProfileUrl must be a valid Instagram profile URL'
            : 'tiktokProfileUrl must be a valid TikTok profile URL';
        },
      },
    });
  };
}
