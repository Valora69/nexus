import { configureApi, http } from '@repo/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { clearStoredToken, getStoredToken, signInWithGoogle } from './auth';

type AuthStatus = 'loading' | 'authed' | 'anon';

interface AuthContextValue {
  status: AuthStatus;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'loading',
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();
  const expiring = useRef(false);

  // Single-flight session expiry: even if many requests 401 at once, we clear
  // the token, wipe the query cache, and flip to `anon` exactly once.
  const expireSession = useCallback(async () => {
    if (expiring.current) return;
    expiring.current = true;
    try {
      await clearStoredToken();
      queryClient.clear();
      setStatus('anon');
    } finally {
      expiring.current = false;
    }
  }, [queryClient]);

  // Wire the shared client's 401 handler to the single-flight expiry.
  useEffect(() => {
    configureApi({ onUnauthorized: () => void expireSession() });
  }, [expireSession]);

  // Cold-start bootstrap: no token → anon; token → validate via /auth/profile.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        if (active) setStatus('anon');
        return;
      }
      try {
        const res = await http('/auth/profile');
        if (!active) return;
        if (res.ok) setStatus('authed');
        else await expireSession();
      } catch {
        if (active) setStatus('anon');
      }
    })();
    return () => {
      active = false;
    };
  }, [expireSession]);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
    setStatus('authed');
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredToken();
    queryClient.clear();
    setStatus('anon');
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
