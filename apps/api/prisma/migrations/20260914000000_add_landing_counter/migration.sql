-- Public landing-page counters (the nav pill's "quick adds"). Purely additive:
-- one new table with no foreign keys, safe to apply before the code ships.
-- Rows are created on the first increment.

-- CreateTable
CREATE TABLE "LandingCounter" (
    "key" TEXT NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingCounter_pkey" PRIMARY KEY ("key")
);
