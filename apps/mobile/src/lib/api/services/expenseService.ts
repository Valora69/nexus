/**
 * Expense CRUD service — mobile mirror of
 * `apps/web/lib/client/services/expenseService.ts`.
 *
 * `createExpense` accepts an optional `clientRequestId` so stage 12's
 * outbox has a single choke point to attach idempotency without every
 * caller needing to know about the outbox. The header follows the
 * `Idempotency-Key` convention the web backend already tolerates on
 * writes; the server treats it as an advisory dedupe hint until the
 * outbox flow ships.
 */

import type {
  Expense,
  ExpenseWithRelations,
} from '@repo/shared/types/entities';
import type {
  CreateExpenseData,
  UpdateExpenseData,
} from '@repo/shared/types/request';

import { apiFetch } from '../client';

export interface CreateExpenseOptions {
  /** Advisory idempotency key. Stage 12's outbox threads this through. */
  clientRequestId?: string;
}

export function createExpense(
  data: CreateExpenseData,
  opts: CreateExpenseOptions = {},
): Promise<Expense> {
  const headers: Record<string, string> = {};
  if (opts.clientRequestId) {
    headers['Idempotency-Key'] = opts.clientRequestId;
  }
  return apiFetch<Expense>('/api/expenses', {
    method: 'POST',
    json: data,
    headers,
  });
}

export function getAllExpenses(
  type?: 'payable' | 'receivable',
  groupId?: string,
): Promise<ExpenseWithRelations[]> {
  const query = new URLSearchParams();
  if (type) query.set('type', type);
  if (groupId) query.set('groupId', groupId);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch<ExpenseWithRelations[]>(`/api/expenses${suffix}`);
}

export function getExpenseById(id: string): Promise<ExpenseWithRelations> {
  return apiFetch<ExpenseWithRelations>(`/api/expenses/${id}`);
}

export function updateExpense(
  id: string,
  data: UpdateExpenseData,
): Promise<Expense> {
  return apiFetch<Expense>(`/api/expenses/${id}`, {
    method: 'PATCH',
    json: data,
  });
}

export function removeExpense(id: string): Promise<void> {
  return apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' });
}
