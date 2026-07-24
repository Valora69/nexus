import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import {
  createGroupSchema,
  groupQuerySchema,
} from '@/lib/server/schemas/group';
import { createGroup, findAllGroups } from '@/lib/server/services/group';

/**
 * POST /api/group  [Auth]
 * Create a new group. The authenticated user becomes the creator and first member.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createGroupSchema, body);
  const group = await createGroup(dto, user.sub);
  return NextResponse.json(group);
});

/**
 * GET /api/group  [Auth]
 * List the current user's groups.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(groupQuerySchema, req.nextUrl.searchParams);
  const groups = await findAllGroups(user.sub, skip, take);
  return NextResponse.json(groups);
});
