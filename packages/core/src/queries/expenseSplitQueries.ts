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
import { queryKeys } from '../queryKeys';

export const useGetAllExpenseSplits = () => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.all(),
    queryFn: () => getAllExpenseSplits(),
    staleTime: 3 * 60 * 1000,
  });
};

// Critical: user's payable splits (they need to pay).
export const useGetMyPayableSplits = () => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.myPayables(),
    queryFn: () => getMyPayableSplits(),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

// Critical: user's receivable splits (they receive money).
export const useGetMyReceivableSplits = () => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.myReceivables(),
    queryFn: () => getMyReceivableSplits(),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useGetSplitsByExpenseId = (expenseId: string) => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.byExpenseId(expenseId),
    queryFn: () => getSplitsByExpenseId(expenseId),
    enabled: !!expenseId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useGetSplitsByUserId = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.byUserId(userId),
    queryFn: () => getSplitsByUserId(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
  });
};

export const useGetExpenseSplitById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expenseSplits.byId(id),
    queryFn: () => getExpenseSplitById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
  });
};
