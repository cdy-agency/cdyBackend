-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

-- Carry over legacy Creator.verified onto existing social accounts
UPDATE "SocialAccount" AS sa
SET "verified" = true
FROM "Creator" AS c
WHERE sa."contentCreatorId" = c."id"
  AND c."verified" = true;
