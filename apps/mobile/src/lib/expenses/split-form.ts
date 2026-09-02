/**
 * Split-editor math shared by the create + edit expense screens.
 *
 * Mirrors the logic in `apps/web/hooks/useExpenseSplit.ts` so both
 * surfaces enforce the same invariants:
 *   - equal mode: divide total evenly across selected members
 *   - custom mode: 0 / empty / negative amounts mean "not participating"
 *     and are silently excluded from the splits array
 *   - splits must sum to totalAmount within a 1-cent tolerance
 *
 * The chosen `payerId` / `payeeId` shape matches web's quirky convention:
 * the receiver of the money (creditor) goes into `payeeId`, and `payerId`
 * is the first *owing* member — a leftover from the original schema where
 * exactly one debtor existed per expense.
 */

import type { ExpenseSplitData } from '@repo/shared/types/request';

export type SplitMode = 'equal' | 'custom';

export type BuildSplitsInput = {
  totalAmount: number;
  selectedMemberIds: string[];
  splitMode: SplitMode;
  customSplits: Record<string, string>;
};

export type BuildSplitsResult = {
  splits: ExpenseSplitData[];
  excludedIds: string[];
};

export function buildSplits({
  totalAmount,
  selectedMemberIds,
  splitMode,
  customSplits,
}: BuildSplitsInput): BuildSplitsResult {
  if (splitMode === 'equal') {
    const share = selectedMemberIds.length
      ? totalAmount / selectedMemberIds.length
      : 0;
    return {
      splits: selectedMemberIds.map((userId) => ({ userId, amount: share })),
      excludedIds: [],
    };
  }

  const splits: ExpenseSplitData[] = [];
  const excludedIds: string[] = [];
  for (const userId of selectedMemberIds) {
    const parsed = parseFloat(customSplits[userId] ?? '0');
    if (!Number.isFinite(parsed) || parsed <= 0) {
      excludedIds.push(userId);
      continue;
    }
    splits.push({ userId, amount: parsed });
  }
  return { splits, excludedIds };
}

export type ValidateSplitsInput = BuildSplitsInput & {
  name: string;
};

export type ValidateSplitsError =
  | 'nameRequired'
  | 'invalidAmount'
  | 'noMembers'
  | 'noParticipants'
  | 'sumMismatch';

export function validateSplits(input: ValidateSplitsInput): {
  ok: boolean;
  error?: ValidateSplitsError;
  splits: ExpenseSplitData[];
} {
  if (!input.name.trim()) {
    return { ok: false, error: 'nameRequired', splits: [] };
  }
  if (!Number.isFinite(input.totalAmount) || input.totalAmount <= 0) {
    return { ok: false, error: 'invalidAmount', splits: [] };
  }
  if (input.selectedMemberIds.length === 0) {
    return { ok: false, error: 'noMembers', splits: [] };
  }
  const { splits } = buildSplits(input);
  if (splits.length === 0) {
    return { ok: false, error: 'noParticipants', splits: [] };
  }
  const sum = splits.reduce((total, s) => total + s.amount, 0);
  if (Math.abs(sum - input.totalAmount) > 0.01) {
    return { ok: false, error: 'sumMismatch', splits };
  }
  return { ok: true, splits };
}

export function pickPayerId(
  splits: ExpenseSplitData[],
  paidByUserId: string,
): string {
  return splits.find((s) => s.userId !== paidByUserId)?.userId ?? paidByUserId;
}
