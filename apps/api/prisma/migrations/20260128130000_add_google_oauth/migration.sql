-- AlterTable: Add Google OAuth fields and remove password
-- Step 1: Add new columns (googleId and picture)
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "picture" TEXT;

-- Step 2: Set temporary googleId values for existing users (if any)
-- This is needed to make the column unique without conflicts
UPDATE "User" SET "googleId" = 'temp_' || "id" WHERE "googleId" IS NULL;

-- Step 3: Make googleId unique and not null
ALTER TABLE "User" ALTER COLUMN "googleId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");

-- Step 4: Drop password column
ALTER TABLE "User" DROP COLUMN "password";
