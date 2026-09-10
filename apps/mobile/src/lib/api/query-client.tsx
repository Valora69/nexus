/**
 * App-wide TanStack Query client + on-device cache persistence.
 *
 * Query defaults mirror `apps/web/lib/client/tanstack-query.tsx` — 60s
 * staleTime, one retry — so a key populated on web and the same key on
 * mobile behave identically.
 *
 * The cache is persisted to AsyncStorage (non-secret; the JWT stays in
 * SecureStore) so that:
 *   - a cold launch offline still shows the last data the user saw,
 *   - a warm return from background hydrates instantly instead of
 *     spinning through skeletons while the network round-trips.
 *
 * The persister only writes *successful* queries (`shouldDehydrateQuery`),
 * so failed/paused/errored entries can't poison the next boot. The buster
 * is tied to the JS bundle's app version — bumping the version invalidates
 * every persisted cache automatically, which is our escape hatch when
 * query shapes change across releases.
 *
 * `queryClient` is exported so non-component code (sign-out, outbox
 * replay in stage 12) can call `queryClient.clear()` / `invalidateQueries`
 * without needing a component tree.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import type { PropsWithChildren } from 'react';

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;
const STORAGE_KEY = 'moneyapp:rq-cache:v1';

// Tie the buster to the app version so a shipped release with a changed
// query shape wipes yesterday's cache on first launch. `nativeApplicationVersion`
// is the binary version on device builds; `expoConfig?.version` covers Expo Go
// and preview builds where the native version isn't stamped in yet.
const APP_VERSION =
  Constants.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'dev';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      // Persisted data can be older than staleTime; `gcTime` must be at
      // least as long as `maxAge` or the persister will restore into a
      // client that immediately garbage-collects it.
      gcTime: SEVEN_DAYS_MS,
      retry: 1,
    },
  },
});

const asyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    } catch (err) {
      // Storage full / IO error — cache miss on next boot is survivable,
      // so swallow rather than crash the app.
      console.warn('[queryPersister] persistClient failed', err);
    }
  },
  restoreClient: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedClient;
    } catch (err) {
      console.warn('[queryPersister] restoreClient failed', err);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-fatal.
    }
  },
};

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: SEVEN_DAYS_MS,
        buster: APP_VERSION,
        dehydrateOptions: {
          // Only persist queries that actually returned data — errored or
          // in-flight queries don't belong in the on-disk snapshot.
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && query.state.data !== undefined,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
