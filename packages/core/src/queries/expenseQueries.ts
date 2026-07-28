'use client';
import { useQuery } from '@tanstack/react-query';

import { getAllExpenses, getExpenseById } from '../services/expenseService';
import { queryKeys } from '../queryKeys';

export const useGetAllExpenses = (
  type?: 'payable' | 'receivable',
  groupId?: string,
) => {
  return useQuery({
    queryKey: queryKeys.expenses.list(type, groupId),
    queryFn: () => getAllExpenses(type, groupId),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useGetExpenseById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expenses.byId(id),
    queryFn: () => getExpenseById(id),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    enabled: !!id,
  });
};
