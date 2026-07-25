import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { findCurrentUser } from '@/lib/server/services/user';

/**
 * GET /api/user/currentuser  [Auth]
 * Returns the current user's profile from the database.
 */
export const GET = withAuth(async (_req: NextRequest, _ctx, user) => {
  const currentUser = await findCurrentUser(user.sub);
  return NextResponse.json(currentUser);
});
