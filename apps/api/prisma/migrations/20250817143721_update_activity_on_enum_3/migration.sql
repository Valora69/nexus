-- AlterEnum
ALTER TYPE "public"."ActivityNameEnum" ADD VALUE 'ASSIGNED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ActivityOnEnum" ADD VALUE 'EXPENSE_PAYEE';
ALTER TYPE "public"."ActivityOnEnum" ADD VALUE 'EXPENSE_PAYER';
