/*
  Warnings:

  - Added the required column `activityName` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activityOn` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Activity" ADD COLUMN     "activityName" "public"."ActivityNameEnum" NOT NULL,
ADD COLUMN     "activityOn" "public"."ActivityOnEnum" NOT NULL;
