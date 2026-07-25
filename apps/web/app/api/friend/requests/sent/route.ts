import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paginationQuerySchema } from '@/lib/server/schemas/friend';
import { getSentRequests } from '@/lib/server/services/friend';

/**
 * GET /api/friend/requests/sent
 *
 * Get friend requests sent by the authenticated user. Requires auth.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(
    paginationQuerySchema,
    req.nextUrl.searchParams,
  );
  const requests = await getSentRequests(user.sub, skip, take);
  return NextResponse.json(requests);
});
