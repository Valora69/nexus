import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { updateGroupSchema } from '@/lib/server/schemas/group';
import {
  findOneGroup,
  updateGroup,
  removeGroup,
} from '@/lib/server/services/group';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/group/:id  [Auth]
 * Find a group by id. Includes a membership check: returns 403 if the
 * requesting user is not a member of the group.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const group = await findOneGroup(id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Membership check — the NestJS version omitted this; added as a fix.
  const isMember = group.members.some((m) => m.user.id === user.sub);
  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  return NextResponse.json(group);
});

/**
 * PATCH /api/group/:id  [Auth]
 * Update a group's details (name, description). Logs an activity.
 */
export const PATCH = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const dto = parseBody(updateGroupSchema, body);
  const updatedGroup = await updateGroup(id, dto, user.sub);
  return NextResponse.json(updatedGroup);
});

/**
 * DELETE /api/group/:id  [Auth]
 * Delete a group. Blocked if unsettled balances or pending payments exist.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const deletedGroup = await removeGroup(id, user.sub);
  return NextResponse.json(deletedGroup);
});
