/**
 * Raw Google OAuth2 authorization-code flow.
 *
 * Replaces passport-google-oauth20 — passport depends on req/res shapes
 * that don't exist in Next.js route handlers. This is a thin wrapper
 * around the three HTTP calls the flow requires:
 *   1. Build the consent URL (redirect the user there).
 *   2. Exchange the authorization code for tokens.
 *   3. Fetch the user's profile from the userinfo endpoint.
 */

// ---- Types ----

export interface GoogleProfile {
  sub: string; // Google account ID
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

// ---- Config ----

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  }
  return { clientId, clientSecret };
}

// ---- Public API ----

/**
 * Build the Google consent URL. The caller should 302-redirect the user
 * to this URL. `redirectUri` is the absolute callback URL for this app
 * (e.g. `https://moneyapp.click/api/auth/google/callback`).
 */
export function buildConsentUrl(redirectUri: string, state: string): string {
  const { clientId } = getConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile', // matches passport scope: ['email', 'profile']
    state,
    access_type: 'online',
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google token exchange failed (${response.status}): ${body}`,
    );
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Fetch the authenticated user's profile from Google.
 */
export async function fetchUserProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google userinfo fetch failed (${response.status}): ${body}`,
    );
  }

  return response.json() as Promise<GoogleProfile>;
}
