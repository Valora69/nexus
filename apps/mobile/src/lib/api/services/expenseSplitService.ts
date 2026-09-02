/**
 * Expense-split reads used by mobile. The home dashboard leans on the
 * aggregated `dashboardService`, but per-split detail (with expense +
 * group relations) powers the drill-down screens landing in later stages.
 * Kept co-located so mobile matches web's service layout one-to-one.
 */

import type { ExpenseSplitWithRelations } from '@repo/shared/types/entities';

import { apiFetch } from '../client';

export function getMyPayableSplits(): Promise<ExpenseSplitWithRelations[]> {
  return apiFetch<ExpenseSplitWithRelations[]>('/api/expense-splits/my-payables');
}

export function getMyReceivableSplits(): Promise<ExpenseSplitWithRelations[]> {
  return apiFetch<ExpenseSplitWithRelations[]>('/api/expense-splits/my-receivables');
}

export function getSplitsByExpenseId(
  expenseId: string,
): Promise<ExpenseSplitWithRelations[]> {
  return apiFetch<ExpenseSplitWithRelations[]>(
    `/api/expense-splits/expense/${expenseId}`,
  );
}
