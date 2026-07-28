import { NextRequest, NextResponse } from 'next/server';
import { buildConsentUrl } from '@/lib/server/google-oauth';
import { signMobileState } from '@/lib/server/mobile-auth';

/**
 * GET /api/auth/google
 *
 * Starts the Google OAuth2 flow.
 *   - Web: sets a short-lived `oauth_state` cookie for CSRF, then redirects.
 *   - Mobile (`?platform=mobile&code_challenge=...`): encodes a signed state
 *     carrying the PKCE challenge (cookie-independent), then redirects.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const { searchParams } = req.nextUrl;

  // ---- Mobile: signed state (no cookie; survives the iOS auth session) ----
  if (searchParams.get('platform') === 'mobile') {
    const codeChallenge = searchParams.get('code_challenge');
    if (!codeChallenge) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'code_challenge is required' } },
        { status: 400 },
      );
    }
    const state = await signMobileState(codeChallenge);
    return NextResponse.redirect(buildConsentUrl(redirectUri, state));
  }

  // ---- Web: random state stored in a short-lived cookie ----
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
