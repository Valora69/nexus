import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { markAllRead } from '@/lib/server/services/notification';

/**
 * POST /api/notifications/read-all  [Auth]
 * Mark every unread notification of the caller as read.
 */
export const POST = withAuth(async (_req, _ctx, user) => {
  const count = await markAllRead(user.sub);
  return NextResponse.json({ count });
});
