import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { createGroupMemberSchema } from '@/lib/server/schemas/group-member';
import {
  createGroupMember,
  findAllGroupMembers,
} from '@/lib/server/services/group-member';

/**
 * POST /api/group-member
 *
 * Create a new group member. Requires auth.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createGroupMemberSchema, body);
  const member = await createGroupMember(dto, user.sub);
  return NextResponse.json(member);
});

/**
 * GET /api/group-member
 *
 * List all group members (no scoping). Requires auth.
 */
export const GET = withAuth(async () => {
  const members = await findAllGroupMembers();
  return NextResponse.json(members);
});
