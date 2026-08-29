/**
 * App-wide TanStack Query client.
 *
 * Defaults mirror `apps/web/lib/client/tanstack-query.tsx` — a 60s
 * staleTime and one retry on transient failures — so a cache key
 * populated on web and the same key on mobile behave identically.
 *
 * `queryClient` is exported so non-component code (sign-out flow, outbox
 * replay in later stages) can call `queryClient.clear()` /
 * `invalidateQueries` without needing a component tree.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
