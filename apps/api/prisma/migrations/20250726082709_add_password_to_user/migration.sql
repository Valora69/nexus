/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add password column with a default value first
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temporary_password_123';

-- Update existing users with a default hashed password (you should change these passwords)
UPDATE "User" SET "password" = '$2a$10$N9qo8uLOickgx2ZMRZoMye.fDdhr.l3BQNQ0Z8k7vdQF7iXl4XY2O' WHERE "password" = 'temporary_password_123';

-- Remove the default constraint
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
