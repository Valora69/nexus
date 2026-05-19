import type { Payment } from '@web/lib/types/entities';

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
