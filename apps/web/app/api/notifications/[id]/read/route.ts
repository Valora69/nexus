import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { markRead } from '@/lib/server/services/notification';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/notifications/:id/read  [Auth]
 * Mark one of the caller's notifications read. 404 if it isn't theirs.
 */
export const POST = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  await markRead(id, user.sub);
  return NextResponse.json({ ok: true });
});
