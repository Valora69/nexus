-- AlterTable
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_pkey" PRIMARY KEY ("id");
-- Keep Expense_id_key because existing FK constraints depend on this unique index
-- (ExpenseSplit_expenseId_fkey and Payment_expenseId_fkey). Dropping it causes P3018 (2BP01).
