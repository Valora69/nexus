/*
  Warnings:

  - You are about to drop the column `userId` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `payeeId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payerId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Expense" DROP COLUMN "userId",
ADD COLUMN     "payeeId" TEXT NOT NULL,
ADD COLUMN     "payerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
