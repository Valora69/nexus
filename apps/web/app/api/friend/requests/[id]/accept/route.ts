import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { acceptRequest } from '@/lib/server/services/friend';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/friend/requests/[id]/accept
 *
 * Accept a friend request by ID. Requires auth.
 */
export const POST = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const result = await acceptRequest(user.sub, id);
  return NextResponse.json(result);
});
