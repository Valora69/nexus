import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { acceptRequestByTokenSchema } from '@/lib/server/schemas/friend';
import { acceptRequestByToken } from '@/lib/server/services/friend';

/**
 * POST /api/friend/requests/accept-by-token
 *
 * Accept a friend request using an email invite token. Requires auth.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const { token } = parseBody(acceptRequestByTokenSchema, body);
  const result = await acceptRequestByToken(user.sub, token);
  return NextResponse.json(result);
});
