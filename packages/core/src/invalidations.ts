import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Domain invalidation helpers. Each helper batches the fixed set of query
 * keys that a write in that domain affects. Mutations call one of these
 * instead of listing keys manually — adding a new related query means
 * editing this file once, not chasing every mutation.
 */

/** Expense create / update / delete touches the splits ledger, the dashboard
 * aggregates, and (via cascade on update/delete) the payments table. */
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

/** Payment create / verify / delete updates the same downstream surfaces. */
export function invalidatePaymentDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenseSplits.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
}

/** Group create / update / delete and member add / remove all funnel here.
 * `['groupMembers']` is kept for forward-compat if a member list view is
 * built; today every consumer reads members via `['groups', id]`. */
export function invalidateGroupDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers.all() });
}

/** Friend send / accept / decline / remove. */
export function invalidateFriendDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.friends.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.friends.requests() });
}

/** User profile updates: name and gcashNumber are denormalized inside
 * group, friend, expense, and payment payloads, so an update has to ripple
 * out. Frequency is low; over-invalidation is acceptable. */
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
