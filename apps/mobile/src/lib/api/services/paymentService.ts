/**
 * Payment CRUD service — mobile mirror of
 * `apps/web/lib/client/services/paymentService.ts`.
 *
 * `createPayment` accepts an optional `clientRequestId` so stage 12's
 * outbox can attach idempotency at the same choke point every other
 * mutating call uses. Header name matches the expense endpoint so the
 * server handles both writes with one dedupe path.
 */

import type {
  Payment,
  PaymentWithRelations,
} from '@repo/shared/types/entities';
import type {
  CreatePaymentData,
  UpdatePaymentData,
} from '@repo/shared/types/request';

import { apiFetch } from '../client';

export interface CreatePaymentOptions {
  /** Advisory idempotency key. Stage 12's outbox threads this through. */
  clientRequestId?: string;
}

export function createPayment(
  data: CreatePaymentData,
  opts: CreatePaymentOptions = {},
): Promise<Payment> {
  const headers: Record<string, string> = {};
  if (opts.clientRequestId) {
    headers['Idempotency-Key'] = opts.clientRequestId;
  }
  return apiFetch<Payment>('/api/payment', {
    method: 'POST',
    json: data,
    headers,
  });
}

export function getAllPayments(): Promise<PaymentWithRelations[]> {
  return apiFetch<PaymentWithRelations[]>('/api/payment');
}

export function getPaymentById(id: string): Promise<PaymentWithRelations> {
  return apiFetch<PaymentWithRelations>(`/api/payment/${id}`);
}

export function getPendingVerification(): Promise<PaymentWithRelations[]> {
  return apiFetch<PaymentWithRelations[]>('/api/payment/pending-verification');
}

export function getPendingConfirmation(): Promise<PaymentWithRelations[]> {
  return apiFetch<PaymentWithRelations[]>('/api/payment/pending-confirmation');
}

export function updatePayment(
  id: string,
  data: UpdatePaymentData,
): Promise<Payment> {
  return apiFetch<Payment>(`/api/payment/${id}`, {
    method: 'PATCH',
    json: data,
  });
}

export function removePayment(id: string): Promise<void> {
  return apiFetch<void>(`/api/payment/${id}`, { method: 'DELETE' });
}
