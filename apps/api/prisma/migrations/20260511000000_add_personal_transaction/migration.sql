-- CreateEnum
CREATE TYPE "PersonalTransactionType" AS ENUM ('EXPENSE', 'CREDIT');

-- CreateTable
CREATE TABLE "PersonalTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PersonalTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "source" TEXT,
    "isFromGroup" BOOLEAN NOT NULL DEFAULT false,
    "expenseSplitId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalTransaction_expenseSplitId_key" ON "PersonalTransaction"("expenseSplitId");

-- CreateIndex
CREATE INDEX "PersonalTransaction_userId_idx" ON "PersonalTransaction"("userId");

-- CreateIndex
CREATE INDEX "PersonalTransaction_userId_type_idx" ON "PersonalTransaction"("userId", "type");

-- CreateIndex
CREATE INDEX "PersonalTransaction_userId_isFromGroup_idx" ON "PersonalTransaction"("userId", "isFromGroup");

-- AddForeignKey
ALTER TABLE "PersonalTransaction" ADD CONSTRAINT "PersonalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalTransaction" ADD CONSTRAINT "PersonalTransaction_expenseSplitId_fkey" FOREIGN KEY ("expenseSplitId") REFERENCES "ExpenseSplit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
