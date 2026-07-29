import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';
const RETURN_URL = 'moneyapp://auth';

// ---- Secure token storage ----

export function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ---- PKCE ----

const VERIFIER_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** Random 64-char code_verifier from the PKCE-allowed charset. */
async function makeCodeVerifier(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(64);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += VERIFIER_CHARS[bytes[i]! % VERIFIER_CHARS.length];
  }
  return out;
}

/** S256 challenge = base64url(SHA-256(verifier)). Matches server verifyPkce. */
async function makeCodeChallenge(verifier: string): Promise<string> {
  const base64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---- Google sign-in (one-time-code + PKCE) ----

/**
 * Runs the native Google OAuth flow:
 *   1. Generate PKCE; open the backend consent URL in an auth session.
 *   2. Capture the `moneyapp://auth?code=` deep link.
 *   3. Exchange the one-time code (+ verifier) for a JWT; store it securely.
 * Returns the JWT on success; throws if cancelled or exchange fails.
 */
export async function signInWithGoogle(): Promise<string> {
  const codeVerifier = await makeCodeVerifier();
  const codeChallenge = await makeCodeChallenge(codeVerifier);

  const authUrl =
    `${API_BASE}/auth/google?platform=mobile` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, RETURN_URL);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Sign-in was cancelled');
  }

  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code;
  if (typeof code !== 'string' || !code) {
    throw new Error('No authorization code returned');
  }

  const res = await fetch(`${API_BASE}/auth/mobile/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });
  if (!res.ok) {
    throw new Error('Token exchange failed');
  }

  const { access_token: token } = (await res.json()) as { access_token: string };
  await setStoredToken(token);
  return token;
}
