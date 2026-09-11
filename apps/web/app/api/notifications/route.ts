import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { notificationListQuerySchema } from '@/lib/server/schemas/notification';
import { listNotifications } from '@/lib/server/services/notification';

/**
 * GET /api/notifications?cursor=&take=  [Auth]
 * The caller's notifications, newest first, keyset-paginated.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { cursor, take } = parseQuery(
    notificationListQuerySchema,
    req.nextUrl.searchParams,
  );
  const page = await listNotifications(user.sub, cursor, take);
  return NextResponse.json(page);
});
