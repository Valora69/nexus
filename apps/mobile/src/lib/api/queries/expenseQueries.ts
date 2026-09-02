/**
 * Expense read hooks — mobile mirror of
 * `apps/web/lib/client/queries/expenseQueries.ts`. Keys are shared via
 * `@repo/shared/queryKeys`, so a create/edit/delete from either surface
 * invalidates both.
 */

import type { ExpenseWithRelations } from '@repo/shared/types/entities';
import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getAllExpenses, getExpenseById } from '../services/expenseService';

export function useGetAllExpenses(
  type?: 'payable' | 'receivable',
  groupId?: string,
) {
  return useQuery<ExpenseWithRelations[]>({
    queryKey: queryKeys.expenses.list(type, groupId),
    queryFn: () => getAllExpenses(type, groupId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetExpenseById(id: string | undefined, enabled = true) {
  return useQuery<ExpenseWithRelations>({
    queryKey: queryKeys.expenses.byId(id ?? ''),
    queryFn: () => getExpenseById(id as string),
    staleTime: 2 * 60 * 1000,
    enabled: enabled && !!id,
  });
}
