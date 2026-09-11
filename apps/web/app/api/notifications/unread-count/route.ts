import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { countUnread } from '@/lib/server/services/notification';

/**
 * GET /api/notifications/unread-count  [Auth]
 * Badge count. Polled by the web bell, so it is a single indexed count.
 */
export const GET = withAuth(async (_req, _ctx, user) => {
  const count = await countUnread(user.sub);
  return NextResponse.json({ count });
});
