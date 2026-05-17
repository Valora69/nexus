-- Corrects accumulated schema drift between schema.prisma and the live DB.
-- Drift sources: prior use of `prisma db push` adding columns/relations to the
-- schema without generating migration files. Applied here as a single
-- additive/correcting migration. Safe on the current dataset (Activity = 0,
-- Payment = 0 rows verified before authoring this migration).

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_expenseId_fkey";

-- DropIndex
DROP INDEX "Group_name_key";

-- DropIndex
DROP INDEX "Payment_expenseId_idx";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "expenseId",
ADD COLUMN     "expenseSplitId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_groupId_idx" ON "Activity"("groupId");

-- CreateIndex
CREATE INDEX "Activity_createdByUserId_idx" ON "Activity"("createdByUserId");

-- CreateIndex
CREATE INDEX "Expense_groupId_idx" ON "Expense"("groupId");

-- CreateIndex
CREATE INDEX "Expense_payerId_idx" ON "Expense"("payerId");

-- CreateIndex
CREATE INDEX "Expense_payeeId_idx" ON "Expense"("payeeId");

-- CreateIndex
CREATE INDEX "Payment_expenseSplitId_idx" ON "Payment"("expenseSplitId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_expenseSplitId_fkey" FOREIGN KEY ("expenseSplitId") REFERENCES "ExpenseSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
