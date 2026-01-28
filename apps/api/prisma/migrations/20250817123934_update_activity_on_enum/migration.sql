/*
  Warnings:

  - The values [PROJECT_DETAILS] on the enum `ActivityOnEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ActivityOnEnum_new" AS ENUM ('GROUP_DETAILS', 'EXPENSE', 'PAYMENT', 'GROUP_MEMBER');
ALTER TABLE "public"."Activity" ALTER COLUMN "activityOn" TYPE "public"."ActivityOnEnum_new" USING ("activityOn"::text::"public"."ActivityOnEnum_new");
ALTER TYPE "public"."ActivityOnEnum" RENAME TO "ActivityOnEnum_old";
ALTER TYPE "public"."ActivityOnEnum_new" RENAME TO "ActivityOnEnum";
DROP TYPE "public"."ActivityOnEnum_old";
COMMIT;
