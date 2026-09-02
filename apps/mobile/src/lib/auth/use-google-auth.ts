/**
 * Native Google sign-in via `expo-auth-session`.
 *
 * The `useIdTokenAuthRequest` result of `promptAsync()` is unreliable on
 * iOS — the OS frequently resolves it as `dismiss` while the *real*
 * success arrives asynchronously via the hook's `response` object. If we
 * only read the promise, the login button dead-ends and the user never
 * lands on Home. So this hook is response-driven: `promptAsync` only
 * launches the sheet, and the `response` effect is the single consumer
 * that surfaces `idToken` (success) or `authError` (error / non-cancel).
 * Cancels reset quietly so the CTA re-arms without a scary message.
 *
 * The iOS client ID must be created in the same Google Cloud project used
 * for the web client; both are accepted as valid audiences by the server.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';

// Required on iOS/Android to close the auth session's system browser tab
// once the callback URL redirects back into the app.
WebBrowser.maybeCompleteAuthSession();

function readIosClientId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (fromEnv) return fromEnv;
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    googleIosClientId?: string;
  };
  return extra.googleIosClientId;
}

export interface UseGoogleAuthResult {
  /** Launches the Google account chooser. Does NOT return the idToken —
   *  consume `idToken` / `authError` from this hook instead. */
  promptAsync: () => Promise<void>;
  /** Whether the underlying request is ready to be triggered. */
  ready: boolean;
  /** Populated when config (env var) is missing so the UI can surface a clear error. */
  configError: string | null;
  /** Set once when Google returns a valid ID token. Caller should consume
   *  it (exchange for a session) and then call `reset()`. */
  idToken: string | null;
  /** User-readable error from a non-cancel failure. */
  authError: string | null;
  /** Clear `idToken` / `authError` after the caller has handled them. */
  reset: () => void;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const iosClientId = readIosClientId();
  const configError = iosClientId
    ? null
    : 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set. See apps/mobile/README.md.';

  const [request, response, prompt] = Google.useIdTokenAuthRequest({
    iosClientId: iosClientId ?? 'missing',
  });

  const [idToken, setIdToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Single consumer of the auth response. Runs on every meaningful transition:
  //  - `success` → surface the id_token for the caller to exchange
  //  - `error`   → surface a readable message
  //  - `cancel` / `dismiss` → reset silently; the CTA will re-arm
  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const token = response.params?.id_token ?? null;
      if (token) {
        setIdToken(token);
        setAuthError(null);
      } else {
        setAuthError('Google did not return an ID token. Please try again.');
      }
      return;
    }
    if (response.type === 'error') {
      const message =
        response.error?.message ??
        'Google sign-in failed. Please try again.';
      setAuthError(message);
      setIdToken(null);
    }
    // `cancel` / `dismiss` → no-op; leave state clean.
  }, [response]);

  const promptAsync = useCallback(async () => {
    if (!iosClientId) {
      setAuthError(configError);
      return;
    }
    setAuthError(null);
    setIdToken(null);
    // The resolved value is intentionally ignored — the `response` effect
    // above is the source of truth. Awaiting still lets callers know the
    // sheet has been dismissed one way or another.
    await prompt();
  }, [iosClientId, configError, prompt]);

  const reset = useCallback(() => {
    setIdToken(null);
    setAuthError(null);
  }, []);

  return {
    promptAsync,
    ready: !!request && !!iosClientId,
    configError,
    idToken,
    authError,
    reset,
  };
}
