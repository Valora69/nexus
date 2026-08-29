import { NextRequest, NextResponse } from 'next/server';
import { withAuth, signToken } from '@/lib/server/auth';

/**
 * POST /api/auth/refresh
 *
 * Sliding session: given a still-valid Bearer token, mint a fresh 7-day
 * token so long-lived mobile clients don't get logged out mid-use.
 * Revocation via a `tokenVersion` claim is a documented later step.
 */
export const POST = withAuth(async (_req: NextRequest, _ctx, user) => {
  const token = await signToken({
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
  return NextResponse.json({ token });
});
