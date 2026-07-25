import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { sendFriendRequestSchema } from '@/lib/server/schemas/friend';
import { sendFriendRequest } from '@/lib/server/services/friend';

/**
 * POST /api/friend/request
 *
 * Send a friend request by email. Requires auth.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const { email } = parseBody(sendFriendRequestSchema, body);
  const result = await sendFriendRequest(user.sub, email);
  return NextResponse.json(result);
});
