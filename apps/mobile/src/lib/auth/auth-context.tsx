/**
 * App-wide auth state machine.
 *
 * Lifecycle:
 *   1. On mount, load token+user from SecureStore. If a token exists, hit
 *      `/api/auth/profile` to validate it before flipping to `signedIn`.
 *      This guarantees a tampered/expired token surfaces on cold start
 *      instead of on the first data screen.
 *   2. On foreground (AppState `active`), silently refresh the token via
 *      `POST /api/auth/refresh` — a sliding 7-day window that keeps
 *      long-lived mobile sessions alive without user friction.
 *   3. Any 401 from any endpoint fires `emitUnauthorized`; we clear
 *      storage and flip to `signedOut`.
 *
 * The context is the only writer of SecureStore. Everything else reads
 * the token indirectly via `setAuthTokenGetter` (registered here).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { apiFetch, onUnauthorized, setAuthTokenGetter } from '../api/client';
import { queryClient } from '../api/query-client';
import {
  clearToken,
  clearUser,
  loadToken,
  loadUser,
  saveToken,
  saveUser,
} from './token-store';
import type { AuthUser, MobileSignInResponse } from './types';

type Status = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  /** Exchange a verified Google idToken for our first-party JWT. */
  signIn: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  // Held in a ref so the api client's synchronous getter never lags the
  // React commit — a stale token here would send a request with the old
  // Bearer *after* signOut had cleared storage.
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (token: string, nextUser: AuthUser) => {
    tokenRef.current = token;
    setUser(nextUser);
    setStatus('signedIn');
    await Promise.all([saveToken(token), saveUser(nextUser)]);
  }, []);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    setStatus('signedOut');
    // Drop cached responses so the next user doesn't briefly see the
    // previous one's data. Safe on cold-start (empty cache is a no-op).
    queryClient.clear();
    await Promise.all([clearToken(), clearUser()]);
  }, []);

  // Register the token getter *once* on mount so the api client can read
  // the current token without importing this module (breaks the cycle).
  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    const unsubscribe = onUnauthorized(() => {
      // Fire-and-forget: never block the failing request on storage IO.
      void clearSession();
    });
    return unsubscribe;
  }, [clearSession]);

  // Restore-then-validate. If the stored token is still valid, `profile`
  // returns the fresh JWT payload and we swap the cached user in place.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedToken, storedUser] = await Promise.all([loadToken(), loadUser()]);
      if (cancelled) return;
      if (!storedToken) {
        setStatus('signedOut');
        return;
      }
      tokenRef.current = storedToken;
      try {
        const fresh = await apiFetch<AuthUser>('/api/auth/profile');
        if (cancelled) return;
        await applySession(storedToken, fresh);
      } catch {
        // `onUnauthorized` will have cleared the session on a 401; a
        // network error should keep the cached user visible so the app
        // is usable offline until the next foreground refresh.
        if (cancelled) return;
        if (storedUser) {
          setUser(storedUser);
          setStatus('signedIn');
        } else {
          await clearSession();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  // Silent refresh whenever the app comes back to the foreground. iOS
  // background execution is unreliable — the docs explicitly say never
  // rely on it — so this is the sanctioned "keep session warm" hook.
  useEffect(() => {
    const handle = (state: AppStateStatus) => {
      if (state !== 'active' || !tokenRef.current) return;
      (async () => {
        try {
          const { token } = await apiFetch<{ token: string }>('/api/auth/refresh', {
            method: 'POST',
          });
          tokenRef.current = token;
          await saveToken(token);
        } catch {
          // 401 → onUnauthorized already handled it. Any other error is
          // transient; we'll try again on the next foreground.
        }
      })();
    };
    const subscription = AppState.addEventListener('change', handle);
    return () => subscription.remove();
  }, []);

  const signIn = useCallback(
    async (idToken: string) => {
      const { token, user: apiUser } = await apiFetch<MobileSignInResponse>(
        '/api/auth/google/mobile',
        { method: 'POST', json: { idToken }, auth: false },
      );
      const nextUser: AuthUser = {
        sub: apiUser.id,
        email: apiUser.email,
        name: apiUser.name,
        picture: apiUser.picture ?? undefined,
      };
      await applySession(token, nextUser);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    // Best-effort server-side cookie clear; mobile session is Bearer-only,
    // but keeping the endpoint call means one code path in server logs.
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore — local cleanup is what matters for the client state.
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
