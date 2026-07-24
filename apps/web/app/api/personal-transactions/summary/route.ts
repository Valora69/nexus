import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { getSummary } from '@/lib/server/services/personal-transaction';

/**
 * GET /api/personal-transactions/summary  [Auth]
 * Returns aggregated summary of personal transactions.
 */
export const GET = withAuth(async (_req: NextRequest, _ctx, user) => {
  const summary = await getSummary(user.sub);
  return NextResponse.json(summary);
});
