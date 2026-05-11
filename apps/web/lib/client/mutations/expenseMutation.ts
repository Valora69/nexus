import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createExpense,
  updateExpense,
  removeExpense,
} from '../services/expenseService';
import {
  CreateExpenseData,
  UpdateExpenseData,
} from '../../types/request';

export const useCreateExpense = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { expenseData: CreateExpenseData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseData }) => createExpense(expenseData),
    onSuccess: (...args) => {
      // 🔄 Invalidate and FORCE refetch immediately
      queryClient.invalidateQueries({
        queryKey: ['expenses'],
        refetchType: 'active', // ✅ Refetch all active queries immediately
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-splits'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useUpdateExpense = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { id: string; expenseData: UpdateExpenseData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, expenseData }) => updateExpense(id, expenseData),
    onSuccess: (...args) => {
      // 🔄 Invalidate and FORCE refetch immediately
      queryClient.invalidateQueries({
        queryKey: ['expenses'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-splits'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveExpense = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => removeExpense(id),
    onSuccess: (...args) => {
      // 🔄 Invalidate and FORCE refetch immediately
      queryClient.invalidateQueries({
        queryKey: ['expenses'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-splits'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
