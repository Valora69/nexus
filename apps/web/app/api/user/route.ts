import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { toErrorResponse } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { createUserSchema } from '@/lib/server/schemas/user';
import { createUser, findAllUsers } from '@/lib/server/services/user';

/**
 * POST /api/user  [Public]
 * Create a new user.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dto = parseBody(createUserSchema, body);
    const user = await createUser(dto);
    return NextResponse.json(user);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * GET /api/user  [Auth]
 * List users scoped to groups the current user is in.
 */
export const GET = withAuth(async (_req: NextRequest, _ctx, user) => {
  const users = await findAllUsers(user.sub);
  return NextResponse.json(users);
});
