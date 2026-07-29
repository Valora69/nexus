/**
 * Native (mobile) OAuth handoff helpers.
 *
 * The mobile app can't use the cookie-based CSRF/session flow, so:
 *   1. It starts OAuth with a signed `state` carrying a PKCE `code_challenge`
 *      (cookie-independent — survives the iOS auth session).
 *   2. The Google callback verifies the state, then mints a short-lived,
 *      single-use `MobileAuthCode` and redirects to `moneyapp://auth?code=`.
 *   3. The app exchanges that code + the PKCE `code_verifier` for a JWT.
 *
 * The JWT never travels in a URL — only the one-time code does.
 */
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';

const STATE_TTL_SECONDS = 300; // 5 min — covers the consent screen
const CODE_TTL_SECONDS = 60; // 1 min — code is exchanged immediately

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(raw);
}

// ---- Signed OAuth state (mobile) ----

interface MobileState {
  platform: 'mobile';
  nonce: string;
  codeChallenge: string;
}

/** Sign a short-lived state token embedding the PKCE challenge. */
export async function signMobileState(codeChallenge: string): Promise<string> {
  return new SignJWT({ platform: 'mobile', nonce: crypto.randomUUID(), codeChallenge })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a mobile state token; returns its payload or null if invalid/expired. */
export async function verifyMobileState(
  state: string,
): Promise<MobileState | null> {
  try {
    const { payload } = await jwtVerify(state, getSecret());
    if (payload.platform !== 'mobile' || typeof payload.codeChallenge !== 'string') {
      return null;
    }
    return payload as unknown as MobileState;
  } catch {
    return null;
  }
}

// ---- PKCE (S256) ----

function base64UrlEncode(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString('base64url');
}

/** Verify a PKCE `code_verifier` against a stored S256 `code_challenge`. */
export async function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
): Promise<boolean> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );
  return base64UrlEncode(digest) === codeChallenge;
}

// ---- One-time code lifecycle ----

/** Mint a single-use code bound to the user and the PKCE challenge. */
export async function createAuthCode(
  userId: string,
  codeChallenge: string,
): Promise<string> {
  const code = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  await prisma.mobileAuthCode.create({
    data: {
      code,
      userId,
      codeChallenge,
      expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
    },
  });
  return code;
}

/**
 * Atomically consume a code: validate existence, expiry, single-use, and PKCE,
 * then mark it consumed. Returns the userId, or null on any failure.
 */
export async function consumeAuthCode(
  code: string,
  codeVerifier: string,
): Promise<string | null> {
  const row = await prisma.mobileAuthCode.findUnique({ where: { code } });
  if (!row || row.consumedAt || row.expiresAt < new Date()) return null;
  if (!(await verifyPkce(codeVerifier, row.codeChallenge))) return null;

  // Single-use: only the first exchange that flips consumedAt wins.
  const consumed = await prisma.mobileAuthCode.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) return null;

  return row.userId;
}
