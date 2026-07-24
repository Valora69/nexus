import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import {
  findOneGroupMember,
  removeGroupMember,
} from '@/lib/server/services/group-member';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/group-member/[id]
 *
 * Find a group member by ID. Requires auth.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const member = await findOneGroupMember(id);
  return NextResponse.json(member);
});

/**
 * DELETE /api/group-member/[id]
 *
 * Remove a group member. Checks for unsettled balances first.
 * Returns 409 with blockers if removal is blocked. Requires auth.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const result = await removeGroupMember(id, user.sub);

  if (result.blocked) {
    return NextResponse.json(
      {
        statusCode: 409,
        message: 'Cannot remove member with unsettled group balances',
        blockers: result.blockers,
        error: 'Conflict',
      },
      { status: 409 },
    );
  }

  return NextResponse.json(result.member);
});
