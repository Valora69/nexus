/**
 * Expense create / update / delete mutations. Mirror web's mutation
 * layer 1:1 — same argument shape, same domain invalidation call — so
 * screens written against one surface work on the other.
 *
 * `useCreateExpense` accepts `clientRequestId` alongside the payload so
 * stage 12's outbox can generate an id, stash the request, and replay
 * it against the same choke point on reconnect without needing a
 * parallel mutation.
 */

import type {
  Expense,
  ExpenseWithRelations,
} from '@repo/shared/types/entities';
import type {
  CreateExpenseData,
  UpdateExpenseData,
} from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidateExpenseDomain } from '../invalidations';
import {
  createExpense,
  removeExpense,
  updateExpense,
} from '../services/expenseService';

export type CreateExpenseArgs = {
  expenseData: CreateExpenseData;
  clientRequestId?: string;
};

export function useCreateExpense(
  mutationOptions?: UseMutationOptions<Expense, Error, CreateExpenseArgs>,
) {
  const queryClient = useQueryClient();
  return useMutation<Expense, Error, CreateExpenseArgs>({
    mutationFn: ({ expenseData, clientRequestId }) =>
      createExpense(expenseData, { clientRequestId }),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useUpdateExpense(
  mutationOptions?: UseMutationOptions<
    Expense,
    Error,
    { id: string; expenseData: UpdateExpenseData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    Expense,
    Error,
    { id: string; expenseData: UpdateExpenseData }
  >({
    mutationFn: ({ id, expenseData }) => updateExpense(id, expenseData),
    ...mutationOptions,
    onSuccess: (...args) => {
      // Split replacement cascade-deletes pending payments — payments cache
      // is invalidated by `invalidateExpenseDomain` for us.
      invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemoveExpense(
  mutationOptions?: UseMutationOptions<void, Error, { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => removeExpense(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

// Re-export the entity types web-style, so callers only import from here.
export type { ExpenseWithRelations };
