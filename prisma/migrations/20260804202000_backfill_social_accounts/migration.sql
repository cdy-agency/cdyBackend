-- Backfill SocialAccount rows from existing denormalized Creator fields
INSERT INTO "SocialAccount" ("contentCreatorId", "platform", "username", "profileUrl", "followers", "createdAt", "updatedAt")
SELECT
  c."id",
  'INSTAGRAM'::"SocialPlatform",
  c."instagramUsername",
  'https://www.instagram.com/' || c."instagramUsername" || '/',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Creator" c
WHERE c."instagramUsername" IS NOT NULL AND c."instagramUsername" <> ''
ON CONFLICT ("contentCreatorId", "platform") DO NOTHING;

INSERT INTO "SocialAccount" ("contentCreatorId", "platform", "username", "profileUrl", "followers", "createdAt", "updatedAt")
SELECT
  c."id",
  'TIKTOK'::"SocialPlatform",
  c."tiktokUsername",
  'https://www.tiktok.com/@' || c."tiktokUsername",
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Creator" c
WHERE c."tiktokUsername" IS NOT NULL AND c."tiktokUsername" <> ''
ON CONFLICT ("contentCreatorId", "platform") DO NOTHING;
