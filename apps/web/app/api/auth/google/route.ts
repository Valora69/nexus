import { NextRequest, NextResponse } from 'next/server';
import { buildConsentUrl } from '@/lib/server/google-oauth';

/**
 * GET /api/auth/google
 *
 * Starts the Google OAuth2 flow. Sets a short-lived `oauth_state` cookie
 * for CSRF protection, then 302-redirects to Google's consent screen.
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

  return response;
}
