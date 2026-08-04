-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK');

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" SERIAL NOT NULL,
    "contentCreatorId" INTEGER NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT,
    "profileUrl" TEXT,
    "followers" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_contentCreatorId_platform_key" ON "SocialAccount"("contentCreatorId", "platform");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_contentCreatorId_fkey" FOREIGN KEY ("contentCreatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
