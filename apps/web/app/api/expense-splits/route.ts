import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paginationSchema } from '@/lib/server/schemas/expense-split';
import { findAll } from '@/lib/server/services/expense-split';

/**
 * GET /api/expense-splits  [Auth]
 * List expense splits scoped to the authenticated user (split owner,
 * payer, or payee on the parent expense).
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(paginationSchema, req.nextUrl.searchParams);
  const splits = await findAll(user.sub, skip, take);
  return NextResponse.json(splits);
});
