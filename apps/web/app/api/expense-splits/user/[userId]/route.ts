import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseQuery } from '@/lib/server/validation';
import { paginationSchema } from '@/lib/server/schemas/expense-split';
import { findByUserId } from '@/lib/server/services/expense-split';

type Ctx = { params: Promise<{ userId: string }> };

/**
 * GET /api/expense-splits/user/:userId  [Auth]
 * Splits for a given user. Only allowed if userId === authenticated user.
 */
export const GET = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { userId } = await ctx.params;

  if (userId !== user.sub) {
    throw new ApiError(403, 'You can only view your own splits');
  }

  const { skip, take } = parseQuery(paginationSchema, req.nextUrl.searchParams);
  const splits = await findByUserId(userId, skip, take);
  return NextResponse.json(splits);
});
