import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { removeFriend } from '@/lib/server/services/friend';

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/friend/[id]
 *
 * Remove a friend (deletes both directions). Requires auth.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const result = await removeFriend(user.sub, id);
  return NextResponse.json(result);
});
