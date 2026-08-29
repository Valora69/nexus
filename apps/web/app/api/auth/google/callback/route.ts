import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, fetchUserProfile } from '@/lib/server/google-oauth';
import { signToken, setAuthCookie } from '@/lib/server/auth';
import { findOrCreateOAuthUser } from '@/lib/server/services/auth-user';

// Reads request query params (the OAuth code/state), so it can never be
// statically rendered — mark it dynamic to skip Next.js's build-time probe.
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user consents. This handler:
 *   1. Verifies the `state` param against the `oauth_state` cookie (CSRF).
 *   2. Exchanges the authorization code for tokens.
 *   3. Fetches the Google profile.
 *   4. Find-or-create the user (exact port of google.strategy.ts).
 *   5. Claims pending friend requests for this email.
 *   6. Signs a JWT, sets the auth cookie, and redirects to the frontend.
 */
export async function GET(req: NextRequest) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = req.cookies.get('oauth_state')?.value;

    if (!code || !state || state !== savedState) {
      return NextResponse.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange code for tokens, then fetch profile.
    const tokens = await exchangeCode(code, redirectUri);
    const profile = await fetchUserProfile(tokens.access_token);

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    // ---- Sign JWT & set cookie ----

    const token = await signToken({
      email: user.email,
      sub: user.id,
      name: user.name,
      picture: user.picture ?? undefined,
    });

    const response = NextResponse.redirect(`${frontendUrl}/home?auth=success`);

    setAuthCookie(response, token);

    // Clear the one-time state cookie.
    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
}
