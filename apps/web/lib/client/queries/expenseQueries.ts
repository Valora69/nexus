'use client';
import { useQuery } from '@tanstack/react-query';

import { getAllExpenses, getExpenseById } from '../services/expenseService';

export const useGetAllExpenses = (type?: 'payable' | 'receivable', groupId?: string) => {
  return useQuery({
    queryKey: ['expenses', type, groupId],
    queryFn: () => getAllExpenses(type, groupId),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useGetExpenseById = (id: string) => {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => getExpenseById(id),
    staleTime: 2 * 60 * 1000, // ⏰ Cache for 2 minutes
    refetchOnMount: 'always', // ✅ Always fresh when viewing details
  });
};
