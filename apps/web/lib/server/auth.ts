import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { toErrorResponse } from './errors';

// ---- Types ----

export interface AuthUser {
  /** User UUID (maps to Prisma `User.id`; stored as `sub` in JWT). */
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

// ---- Helpers ----

function getSecret() {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(raw);
}

/**
 * Extract and verify the JWT from the request.
 * Checks `Authorization: Bearer <token>` first, then the `token` cookie —
 * matching the NestJS `AuthGuard` priority.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  const token = bearer ?? req.cookies.get('token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AuthUser;
  } catch {
    // Expired, malformed, or wrong secret → treat as unauthenticated.
    return null;
  }
}

/**
 * Sign a new JWT with the same claims the NestJS backend uses.
 * HS256 + 7-day expiry to match `auth.module.ts`.
 */
export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

// ---- Cookie helpers ----

export function setAuthCookie(res: NextResponse, token: string): void {
  const cookieDomain = process.env.COOKIE_DOMAIN; // e.g. ".moneyapp.click"

  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

export function clearAuthCookie(res: NextResponse): void {
  const cookieDomain = process.env.COOKIE_DOMAIN;

  res.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

// ---- Route wrapper (AuthGuard replacement) ----

/**
 * Wraps a route handler to require authentication. Returns 401 if no valid
 * JWT is present; catches ApiError and unknown errors → NestJS-shaped JSON.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx, user) => { ... });
 */
export function withAuth<C extends { params: Promise<Record<string, string>> }>(
  handler: (req: NextRequest, ctx: C, user: AuthUser) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: C): Promise<NextResponse> => {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
        { status: 401 },
      );
    }

    try {
      return await handler(req, ctx, user);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
