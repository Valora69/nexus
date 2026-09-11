-- Stage 12 (mobile offline outbox): add client-supplied idempotency keys
-- to Expense and Payment. NULL is allowed and non-unique-across-nulls
-- (Postgres default UNIQUE semantics), so pre-existing web-originated
-- writes are unaffected. The mobile outbox generates a UUIDv4 per queued
-- action and reuses it on retry, so a replayed request violates the
-- unique index instead of double-writing; the service catches that
-- violation and returns the existing row.

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "clientRequestId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "clientRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_clientRequestId_key" ON "Expense"("clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_clientRequestId_key" ON "Payment"("clientRequestId");
