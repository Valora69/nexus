import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  updateExpense,
  removeExpense,
} from '../services/expenseService';
import { CreateExpenseData, UpdateExpenseData } from '../../types/request';
import { invalidateExpenseDomain } from '../invalidations';

export const useCreateExpense = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { expenseData: CreateExpenseData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { expenseData: CreateExpenseData }>({
    mutationFn: ({ expenseData }) => createExpense(expenseData),
    onSuccess: (...args) => {
      invalidateExpenseDomain(queryClient);
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

  return useMutation<
    unknown,
    Error,
    { id: string; expenseData: UpdateExpenseData }
  >({
    mutationFn: ({ id, expenseData }) => updateExpense(id, expenseData),
    onSuccess: (...args) => {
      // Split replacement cascade-deletes pending payments — payments cache must refresh.
      invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveExpense = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => removeExpense(id),
    onSuccess: (...args) => {
      invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
