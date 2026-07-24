import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { updateUserSchema } from '@/lib/server/schemas/user';
import {
  findOneUser,
  updateUser,
  removeUser,
} from '@/lib/server/services/user';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/user/:id  [Auth]
 * Find a user by id.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, _user) => {
  const { id } = await ctx.params;
  const user = await findOneUser(id);
  return NextResponse.json(user);
});

/**
 * PATCH /api/user/:id  [Auth]
 * Update a user. Only the user themselves can update their own account.
 */
export const PATCH = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  if (user.sub !== id) {
    throw new ApiError(403, 'You can only update your own account');
  }
  const body = await req.json();
  const dto = parseBody(updateUserSchema, body);
  const updatedUser = await updateUser(id, dto);
  return NextResponse.json(updatedUser);
});

/**
 * DELETE /api/user/:id  [Auth]
 * Delete a user. Only the user themselves can delete their own account.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  if (user.sub !== id) {
    throw new ApiError(403, 'You can only delete your own account');
  }
  const deletedUser = await removeUser(id);
  return NextResponse.json(deletedUser);
});
