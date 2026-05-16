'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Shared QueryClient instance. Exported so non-component code (logout flow,
 * route handlers running on the client) can call `queryClient.clear()` etc.
 *
 * Defaults are deliberately moderate:
 *   - staleTime 60s: cuts duplicate fetches on rapid re-renders / nav, but
 *     stays short enough that financial data feels live.
 *   - refetchOnWindowFocus: returning to the tab re-syncs caches users are
 *     looking at right now.
 *   - retry 1: one retry on transient network errors, no further to avoid
 *     piling up failing fetches.
 *
 * Per-query overrides (e.g. payables/receivables use `refetchOnMount: 'always'`)
 * still take precedence — these are the safe floor.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export const ReactQueryClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
