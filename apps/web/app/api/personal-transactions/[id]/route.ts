import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { remove } from '@/lib/server/services/personal-transaction';

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/personal-transactions/[id]  [Auth]
 * Remove a personal transaction (ownership check + group-linked protection).
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const result = await remove(id, user.sub);
  return NextResponse.json(result);
});
