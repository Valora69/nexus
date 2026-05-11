/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Expense` table. All the data in the column will be lost.
  - Made the column `expenseId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_paymentId_fkey";

-- DropIndex
DROP INDEX "public"."Expense_paymentId_key";

-- AlterTable
ALTER TABLE "public"."Expense" DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "expenseId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Payment_expenseId_idx" ON "public"."Payment"("expenseId");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
