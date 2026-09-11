'use client';
import { useQuery } from '@tanstack/react-query';

import { getAllExpenses, getExpenseById } from '../services/expenseService';
import { queryKeys } from '../queryKeys';
import { LIVE_REFETCH } from '../live';

export const useGetAllExpenses = (
  type?: 'payable' | 'receivable',
  groupId?: string,
) => {
  return useQuery({
    queryKey: queryKeys.expenses.list(type, groupId),
    ...LIVE_REFETCH,
    queryFn: () => getAllExpenses(type, groupId),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useGetExpenseById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expenses.byId(id),
    ...LIVE_REFETCH,
    queryFn: () => getExpenseById(id),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    enabled: !!id,
  });
};
