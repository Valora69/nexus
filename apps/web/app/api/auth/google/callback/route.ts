import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, fetchUserProfile } from '@/lib/server/google-oauth';
import { signToken, setAuthCookie } from '@/lib/server/auth';
import { verifyMobileState, createAuthCode } from '@/lib/server/mobile-auth';
import { prisma } from '@/lib/server/db';

// Reads request query params (the OAuth code/state), so it can never be
// statically rendered — mark it dynamic to skip Next.js's build-time probe.
export const dynamic = 'force-dynamic';

// Deep link the native app registers (see apps/mobile app.json `scheme`).
const MOBILE_REDIRECT = 'moneyapp://auth';

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here after the user consents. This handler:
 *   1. Verifies `state` — a signed mobile state, else the web `oauth_state` cookie.
 *   2. Exchanges the authorization code for tokens; fetches the Google profile.
 *   3. Find-or-create the user; claims pending friend requests.
 *   4. Web: signs a JWT, sets the auth cookie, redirects to the frontend.
 *      Mobile: mints a one-time code and redirects to `moneyapp://auth?code=`
 *      (the JWT is fetched out-of-band via /api/auth/mobile/exchange).
 */
export async function GET(req: NextRequest) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    // Platform detection: a valid signed mobile state → mobile flow; otherwise
    // fall back to the web cookie-based CSRF check (unchanged behaviour).
    const mobileState = await verifyMobileState(state);
    if (!mobileState) {
      const savedState = req.cookies.get('oauth_state')?.value;
      if (state !== savedState) {
        return NextResponse.redirect(
          `${frontendUrl}/login?error=invalid_state`,
        );
      }
    }

    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange code for tokens, then fetch profile.
    const tokens = await exchangeCode(code, redirectUri);
    const profile = await fetchUserProfile(tokens.access_token);

    // Normalize email — matches google.strategy.ts behaviour.
    const email = profile.email.toLowerCase();
    const googleId = profile.sub;
    const name = profile.name;
    const picture = profile.picture;

    // ---- Find or create user (port of google.strategy.ts) ----

    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      // Fallback: find by email (user may exist from an old system).
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Backfill Google ID + profile fields.
        user = await prisma.user.update({
          where: { email },
          data: {
            googleId,
            picture: picture || user.picture,
            name: user.name || name,
          },
        });
      } else {
        // Brand-new user.
        user = await prisma.user.create({
          data: { email, name, googleId, picture },
        });
      }
    }

    // Claim pending friend requests addressed to this email.
    await prisma.friendRequest.updateMany({
      where: {
        recipientEmail: email,
        recipientId: null,
        status: 'PENDING',
      },
      data: { recipientId: user.id },
    });

    // ---- Mobile: mint a one-time code and deep-link back to the app ----
    // (Custom-scheme redirect built manually — NextResponse.redirect expects
    // an http(s) URL.)
    if (mobileState) {
      const authCode = await createAuthCode(user.id, mobileState.codeChallenge);
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: `${MOBILE_REDIRECT}?code=${encodeURIComponent(authCode)}`,
        },
      });
    }

    // ---- Web: sign JWT & set cookie ----

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
