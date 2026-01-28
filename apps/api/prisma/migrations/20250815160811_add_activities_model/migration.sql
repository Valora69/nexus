-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
