import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paginationQuerySchema } from '@/lib/server/schemas/friend';
import { getFriends } from '@/lib/server/services/friend';

/**
 * GET /api/friend
 *
 * List the authenticated user's friends. Requires auth.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(
    paginationQuerySchema,
    req.nextUrl.searchParams,
  );
  const friends = await getFriends(user.sub, skip, take);
  return NextResponse.json(friends);
});
