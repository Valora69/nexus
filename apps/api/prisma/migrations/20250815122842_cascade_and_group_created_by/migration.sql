/*
  Warnings:

  - Added the required column `createdByUserId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Group" ADD COLUMN     "createdByUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
