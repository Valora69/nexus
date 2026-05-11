-- AlterTable
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "public"."Expense_id_key";
