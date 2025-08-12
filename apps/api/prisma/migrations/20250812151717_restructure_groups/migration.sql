/*
  Warnings:

  - The primary key for the `Expense` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `paidById` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_paidById_fkey";

-- DropForeignKey
ALTER TABLE "public"."Participant" DROP CONSTRAINT "Participant_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_participantId_fkey";

-- AlterTable
ALTER TABLE "public"."Expense" DROP CONSTRAINT "Expense_pkey",
DROP COLUMN "paidById",
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "participantId",
ADD COLUMN     "expenseId" TEXT,
ADD COLUMN     "paymentProof" TEXT;

-- DropTable
DROP TABLE "public"."Participant";

-- CreateIndex
CREATE UNIQUE INDEX "Expense_id_key" ON "public"."Expense"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_paymentId_key" ON "public"."Expense"("paymentId");

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
