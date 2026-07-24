import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';

/**
 * GET /api/auth/profile
 *
 * Returns the authenticated user's JWT payload.
 * Matches NestJS `GET /auth/profile` which returns `req.user`.
 */
export const GET = withAuth(async (_req: NextRequest, _ctx, user) => {
  return NextResponse.json(user);
});
