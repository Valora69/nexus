import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paginationSchema } from '@/lib/server/schemas/expense-split';
import { findMyReceivables } from '@/lib/server/services/expense-split';

/**
 * GET /api/expense-splits/my-receivables  [Auth]
 * Splits where others still owe the authenticated user.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(paginationSchema, req.nextUrl.searchParams);
  const splits = await findMyReceivables(user.sub, skip, take);
  return NextResponse.json(splits);
});
