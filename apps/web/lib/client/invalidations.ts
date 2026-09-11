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
  // Group detail embeds expense totals.
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
}

/** Payment create / verify / delete updates the same downstream surfaces.
 * Expenses carry `splits.payments` (paid badges, edit lock), so they refetch
 * too, as does group detail. */
export function invalidatePaymentDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenseSplits.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
  // Verifying resolves the payee's "confirm receipt" notification server-side.
  invalidateNotificationDomain(queryClient);
}

type VerifiedPayment = {
  id: string;
  isVerified: boolean;
  verifiedAt?: string | null;
};

/** Returns `node` with any embedded copy of `payment` (matched by id)
 * replaced; untouched branches keep their identity so React skips them. */
function patchPayment(node: unknown, payment: VerifiedPayment): unknown {
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((child) => {
      const patched = patchPayment(child, payment);
      if (patched !== child) changed = true;
      return patched;
    });
    return changed ? next : node;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj.id === payment.id && 'isVerified' in obj) {
      return {
        ...obj,
        isVerified: payment.isVerified,
        verifiedAt: payment.verifiedAt,
      };
    }
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const patched = patchPayment(value, payment);
      if (patched !== value) changed = true;
      next[key] = patched;
    }
    return changed ? next : node;
  }
  return node;
}

/**
 * Writes a just-verified payment (the server's PATCH response) into every
 * cached view that embeds it — payment lists, `expenses[].splits[].payments`,
 * split lists — so the verifier sees "Verified"/"Paid" the moment the
 * mutation resolves instead of after a refetch round trip. Call alongside
 * `invalidatePaymentDomain`, whose refetch then reconciles anything derived
 * server-side (dashboard totals, other users' writes).
 */
export function applyVerifiedPayment(
  queryClient: QueryClient,
  payment: VerifiedPayment,
) {
  for (const queryKey of [
    queryKeys.payments.all(),
    queryKeys.expenses.all(),
    queryKeys.expenseSplits.all(),
  ]) {
    queryClient.setQueriesData({ queryKey }, (old: unknown) =>
      patchPayment(old, payment),
    );
  }
  if (payment.isVerified) {
    queryClient.setQueryData(
      queryKeys.payments.pendingVerification(),
      (old: unknown) =>
        Array.isArray(old)
          ? old.filter((p: { id: string }) => p.id !== payment.id)
          : old,
    );
  }
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
  // Accept / decline resolve the friend-request notification server-side.
  invalidateNotificationDomain(queryClient);
}

/** Badge count and inbox list. */
export function invalidateNotificationDomain(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
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
