import type { Payment } from '../types/entities';

// Settlement is the sum of *verified* payments against the split's share.
// A split is considered settled when verified payments cover the share
// (within a 1-cent rounding tolerance).
//
// `isPaid` / `paidAt` columns on ExpenseSplit are deprecated and never
// updated by the backend — always compute from the payments array instead.
export function verifiedPaid(payments: Payment[] | undefined): number {
  if (!payments) return 0;
  return payments.reduce((s, p) => (p.isVerified ? s + p.amountPaid : s), 0);
}

export function isSplitSettled(split: {
  amount: number;
  payments?: Payment[];
}): boolean {
  return split.amount - verifiedPaid(split.payments) <= 0.01;
}

/** Sum of payments the payee has not verified yet. */
export function pendingPaid(payments: Payment[] | undefined): number {
  if (!payments) return 0;
  return payments.reduce((s, p) => (p.isVerified ? s : s + p.amountPaid), 0);
}

export type SplitStatus = 'paid' | 'pending' | 'partial' | 'unpaid';

/**
 * - paid: verified payments cover the share
 * - pending: verified + unverified payments cover it; waiting on the payee
 * - partial: some payment recorded, but not enough to cover the share
 * - unpaid: nothing recorded
 */
export function splitStatus(split: {
  amount: number;
  payments?: Payment[];
}): SplitStatus {
  if (isSplitSettled(split)) return 'paid';
  const verified = verifiedPaid(split.payments);
  const pending = pendingPaid(split.payments);
  if (split.amount - (verified + pending) <= 0.01) return 'pending';
  if (verified + pending > 0) return 'partial';
  return 'unpaid';
}

/** True once anyone has recorded a payment (pending or verified) against
 * any split. The server refuses edits past this point. */
export function hasAnyPayment(
  splits: Array<{ payments?: Payment[] }> | undefined,
): boolean {
  return !!splits?.some((s) => (s.payments?.length ?? 0) > 0);
}

/**
 * Settlement summary for an expense. Only splits that are actual debts
 * count: the payee's own share (`userId === payeeId`) is excluded since
 * they fronted the money.
 */
export function expenseSettlement(expense: {
  payeeId?: string | null;
  splits?: Array<{ userId: string; amount: number; payments?: Payment[] }>;
}): {
  owing: number;
  settled: number;
  hasAnyPayment: boolean;
  isFullySettled: boolean;
} {
  const debts = (expense.splits ?? []).filter(
    (s) => s.userId !== expense.payeeId,
  );
  const settled = debts.filter(isSplitSettled).length;
  return {
    owing: debts.length,
    settled,
    hasAnyPayment: hasAnyPayment(expense.splits),
    isFullySettled: debts.length > 0 && settled === debts.length,
  };
}

export function latestVerifiedPaymentAt(
  payments: Payment[] | undefined,
): string | undefined {
  if (!payments?.length) return undefined;
  const verified = payments.filter((p) => p.isVerified);
  if (!verified.length) return undefined;
  return verified.reduce(
    (latest, p) => (!latest || p.paidAt > latest ? p.paidAt : latest),
    undefined as string | undefined,
  );
}
