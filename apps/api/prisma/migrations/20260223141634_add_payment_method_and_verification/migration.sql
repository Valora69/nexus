-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('GCASH', 'CASH');

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "gcashNumber" TEXT;
