-- Drop FK constraints that are physically backed by Expense_id_key.
-- PostgreSQL attached these FKs to the unique index (not the PK) because
-- Expense had no primary key when these migrations ran. We must drop and
-- re-add them so they rebind to the restored primary key below.
ALTER TABLE "public"."ExpenseSplit" DROP CONSTRAINT "ExpenseSplit_expenseId_fkey";
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_expenseId_fkey";

-- Restore the primary key on Expense.
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_pkey" PRIMARY KEY ("id");

-- Now safe to drop the unique index — no constraints depend on it anymore.
DROP INDEX "public"."Expense_id_key";

-- Re-add FK constraints; they now reference the primary key.
ALTER TABLE "public"."ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey"
    FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_expenseId_fkey"
    FOREIGN KEY ("expenseId") REFERENCES "public"."Expense"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
