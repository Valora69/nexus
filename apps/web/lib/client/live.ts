/**
 * Polling for money-state queries (payments, expenses, splits, dashboard).
 *
 * Cache invalidation only covers the current user's own writes; another
 * user verifying or recording a payment is invisible until the next fetch.
 * A short interval keeps open screens in sync across users. TanStack only
 * polls mounted queries, and `refetchIntervalInBackground: false` pauses
 * hidden tabs, so idle load stays low.
 */
export const LIVE_REFETCH = {
  refetchInterval: 15_000,
  refetchIntervalInBackground: false,
} as const;
