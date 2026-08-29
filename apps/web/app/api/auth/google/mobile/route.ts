import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { signToken } from '@/lib/server/auth';
import { ApiError, toErrorResponse } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { googleMobileSignInSchema } from '@/lib/server/schemas/auth';
import { findOrCreateOAuthUser } from '@/lib/server/services/auth-user';

// Module-scoped JWKS instance — `createRemoteJWKSet` caches keys internally
// and reuses them across warm invocations.
const googleJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

const VALID_ISSUERS = new Set([
  'accounts.google.com',
  'https://accounts.google.com',
]);

interface GoogleIdTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * POST /api/auth/google/mobile
 *
 * Native mobile sign-in: verifies a Google idToken (issued to the iOS
 * client) and returns a first-party JWT the app can use as a Bearer token.
 * No cookie is set — mobile stores the token in secure storage.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { idToken } = parseBody(googleMobileSignInSchema, body);

    const iosClientId = process.env.GOOGLE_IOS_CLIENT_ID;
    const webClientId = process.env.GOOGLE_CLIENT_ID;
    const validAudiences = [iosClientId, webClientId].filter(
      (v): v is string => !!v,
    );
    if (validAudiences.length === 0) {
      throw new ApiError(500, 'Google client IDs are not configured');
    }

    let payload: GoogleIdTokenPayload;
    try {
      const verified = await jwtVerify(idToken, googleJwks, {
        audience: validAudiences,
      });
      if (!VALID_ISSUERS.has(String(verified.payload.iss))) {
        throw new Error('Invalid issuer');
      }
      payload = verified.payload as unknown as GoogleIdTokenPayload;
    } catch {
      throw new ApiError(401, 'Invalid Google idToken');
    }

    if (!payload.sub || !payload.email) {
      throw new ApiError(401, 'Google idToken is missing required claims');
    }

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture,
    });

    const token = await signToken({
      email: user.email,
      sub: user.id,
      name: user.name,
      picture: user.picture ?? undefined,
    });

    return NextResponse.json({ token, user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
