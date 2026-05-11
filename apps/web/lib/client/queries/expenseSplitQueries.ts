'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllExpenseSplits,
  getMyPayableSplits,
  getMyReceivableSplits,
  getSplitsByExpenseId,
  getSplitsByUserId,
  getExpenseSplitById,
} from '../services/expenseSplitService';

export const useGetAllExpenseSplits = () => {
  return useQuery({
    queryKey: ['expense-splits'],
    queryFn: () => getAllExpenseSplits(),
    staleTime: 3 * 60 * 1000, // ⏰ Cache for 3 minutes - less critical
  });
};

// Critical: User's payable splits (they need to pay)
export const useGetMyPayableSplits = () => {
  return useQuery({
    queryKey: ['expense-splits', 'my-payables'],
    queryFn: () => getMyPayableSplits(),
    staleTime: 1 * 60 * 1000, // ⏰ 1 minute - time-sensitive
    refetchOnMount: 'always', // ✅ Always fresh on mount
    refetchOnWindowFocus: true, // ✅ Refetch when user returns
  });
};

// Critical: User's receivable splits (they receive money)
export const useGetMyReceivableSplits = () => {
  return useQuery({
    queryKey: ['expense-splits', 'my-receivables'],
    queryFn: () => getMyReceivableSplits(),
    staleTime: 1 * 60 * 1000, // ⏰ 1 minute - time-sensitive
    refetchOnMount: 'always', // ✅ Always fresh on mount
    refetchOnWindowFocus: true, // ✅ Refetch when user returns
  });
};

export const useGetSplitsByExpenseId = (expenseId: string) => {
  return useQuery({
    queryKey: ['expense-splits', 'expense', expenseId],
    queryFn: () => getSplitsByExpenseId(expenseId),
    enabled: !!expenseId,
    staleTime: 2 * 60 * 1000, // ⏰ Cache for 2 minutes
  });
};

export const useGetSplitsByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['expense-splits', 'user', userId],
    queryFn: () => getSplitsByUserId(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // ⏰ Cache for 3 minutes
  });
};

// Detail view: Single split
export const useGetExpenseSplitById = (id: string) => {
  return useQuery({
    queryKey: ['expense-splits', id],
    queryFn: () => getExpenseSplitById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // ⏰ Cache for 2 minutes
    refetchOnMount: 'always', // ✅ Always fresh when viewing details
  });
};
