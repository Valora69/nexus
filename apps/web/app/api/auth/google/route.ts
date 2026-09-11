import { NextRequest, NextResponse } from 'next/server';
import {
  buildConsentUrl,
  OAUTH_RETURN_COOKIE,
  safeReturnPath,
} from '@/lib/server/google-oauth';

/**
 * GET /api/auth/google
 *
 * Starts the Google OAuth2 flow. Sets a short-lived `oauth_state` cookie
 * for CSRF protection, then 302-redirects to Google's consent screen.
 * An optional `?returnTo=/relative/path` (validated) is remembered so the
 * callback can send the user back there — e.g. to finish accepting an
 * emailed friend invite instead of landing on the dashboard.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Generate a random state token for CSRF protection.
  const state = crypto.randomUUID();

  const consentUrl = buildConsentUrl(redirectUri, state);

  const response = NextResponse.redirect(consentUrl);

  // Store state in a short-lived httpOnly cookie so the callback can verify it.
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes — plenty for the consent flow
  });

  // Always (re)write it: a plain sign-in must not inherit a return path left
  // over from an abandoned invite sign-in.
  const returnTo = safeReturnPath(req.nextUrl.searchParams.get('returnTo'));
  response.cookies.set(OAUTH_RETURN_COOKIE, returnTo ?? '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: returnTo ? 600 : 0,
  });

  return response;
}
