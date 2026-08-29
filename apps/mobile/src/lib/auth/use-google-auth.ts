/**
 * Native Google sign-in via `expo-auth-session`.
 *
 * `useIdTokenAuthRequest` opens the iOS/Android system browser, completes
 * the OAuth flow with Google, and hands us back an ID token we forward to
 * `POST /api/auth/google/mobile`. The backend verifies the token against
 * Google's JWKS and returns our own HS256 JWT.
 *
 * The iOS client ID must be created in the same Google Cloud project used
 * for the web client; both are accepted as valid audiences by the server.
 * See `apps/mobile/README.md` for setup.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useEffect } from 'react';

// Required on iOS/Android to close the auth session's system browser tab
// once the callback URL redirects back into the app.
WebBrowser.maybeCompleteAuthSession();

function readIosClientId(): string | undefined {
  // Prefer the public env var (works in dev + EAS). Fall back to the
  // Expo config extra block for release-time overrides.
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (fromEnv) return fromEnv;
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    googleIosClientId?: string;
  };
  return extra.googleIosClientId;
}

export interface UseGoogleAuthResult {
  /** Undefined until the request is prepared; `null` if config is missing. */
  request: ReturnType<typeof Google.useIdTokenAuthRequest>[0] | null;
  /** Trigger the OAuth flow. Rejects if config is missing. */
  promptAsync: () => Promise<string | null>;
  /** Whether the underlying request is ready to be triggered. */
  ready: boolean;
  /** Populated when config is missing so the UI can surface a clear error. */
  configError: string | null;
}

/**
 * Returns a stable helper for triggering Google sign-in and receiving an
 * `idToken` back. Handling of the returned token (POST to backend, store,
 * update context) belongs in the caller so this hook stays UI-agnostic.
 */
export function useGoogleAuth(): UseGoogleAuthResult {
  const iosClientId = readIosClientId();
  const configError = iosClientId
    ? null
    : 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set. See apps/mobile/README.md.';

  const [request, response, prompt] = Google.useIdTokenAuthRequest({
    iosClientId: iosClientId ?? 'missing',
  });

  // Surface transport-level failures (user cancels, network drops) so the
  // caller can render a toast — the resolved idToken flow is handled inline
  // by `promptAsync`.
  useEffect(() => {
    if (response?.type === 'error') {
      console.warn('[useGoogleAuth] auth response error', response.error);
    }
  }, [response]);

  const promptAsync = async (): Promise<string | null> => {
    if (!iosClientId) throw new Error(configError!);
    const result = await prompt();
    if (result.type !== 'success') return null;
    return result.params.id_token ?? null;
  };

  return {
    request: iosClientId ? request : null,
    promptAsync,
    ready: !!request && !!iosClientId,
    configError,
  };
}
