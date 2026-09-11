/**
 * Expense create / update / delete mutations. Mirror web's mutation
 * layer 1:1 — same argument shape, same domain invalidation call — so
 * screens written against one surface work on the other.
 *
 * `useCreateExpense` routes through the stage-12 offline outbox choke
 * point: online = direct POST with the caller's `clientRequestId` as
 * the Idempotency-Key; offline (or if the request drops mid-flight)
 * = enqueue to SQLite for the replay engine. The mutation's return
 * value is a discriminated `SubmitResult<Expense>` so callers can tell
 * whether the write hit the server or was queued.
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

import { useAuth } from '../../auth/auth-context';
import { submitCreateExpense, type SubmitResult } from '../../offline';
import { invalidateExpenseDomain } from '../invalidations';
import { removeExpense, updateExpense } from '../services/expenseService';

export type CreateExpenseArgs = {
  expenseData: CreateExpenseData;
  clientRequestId: string;
};

export function useCreateExpense(
  mutationOptions?: UseMutationOptions<
    SubmitResult<Expense>,
    Error,
    CreateExpenseArgs
  >,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<SubmitResult<Expense>, Error, CreateExpenseArgs>({
    mutationFn: ({ expenseData, clientRequestId }) => {
      if (!user) {
        // Should be impossible from any (app) screen — the guarded
        // layout redirects to /login before render — but the type
        // system does not know that, and enqueueing without a user id
        // would violate the outbox's per-user partitioning.
        throw new Error('Cannot create an expense while signed out');
      }
      return submitCreateExpense(expenseData, {
        userId: user.sub,
        clientRequestId,
      });
    },
    ...mutationOptions,
    onSuccess: (result, ...rest) => {
      // Only invalidate on a sent write — a queued row will get its
      // invalidation from the replay engine once the server responds.
      if (result.kind === 'sent') invalidateExpenseDomain(queryClient);
      mutationOptions?.onSuccess?.(result, ...rest);
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
