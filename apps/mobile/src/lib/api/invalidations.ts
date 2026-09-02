/**
 * Domain invalidation helpers — mobile mirror of
 * `apps/web/lib/client/invalidations.ts`.
 *
 * Every mutation calls one of these helpers instead of listing keys
 * directly, so wiring up a new consumer (say, a per-group balance query
 * added in a later stage) only needs an edit here — not a hunt through
 * every mutation file. Keeping the shape identical to web also means the
 * mental model transfers 1:1 and cache invariants stay honored on both
 * surfaces.
 */

import { queryKeys } from '@repo/shared/queryKeys';
import type { QueryClient } from '@tanstack/react-query';

/** Expense create / update / delete — touches splits, payments, dashboard. */
export function invalidateExpenseDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenses.all(),
    refetchType: 'active',
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.expenseSplits.all(),
    refetchType: 'active',
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
}

/** Payment create / verify / delete — same downstream surfaces as expenses. */
export function invalidatePaymentDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenseSplits.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
}

/** Group create / update / delete and member add / remove. */
export function invalidateGroupDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers.all() });
}

/** Friend send / accept / decline / remove. */
export function invalidateFriendDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.friends.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests() });
}

/** User profile update — name / gcashNumber are denormalized widely. */
export function invalidateUserDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.user.current() });
  queryClient.invalidateQueries({ queryKey: queryKeys.user.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.friends.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenseSplits.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
}

/** Personal transaction quick-capture. */
export function invalidatePersonalTransactionDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.personalTransactions.all(),
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
}
