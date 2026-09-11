/**
 * Single choke point for the two append-only offline actions.
 *
 * Callers (`useCreateExpense`, `useCreatePayment`) hand a payload plus
 * a stable `clientRequestId` and get back a discriminated result:
 *   - `{ kind: 'sent', data }` — the server acknowledged the write.
 *   - `{ kind: 'queued' }`    — the write was durably enqueued for the
 *                               replay engine (device is offline, or a
 *                               request that started online lost the
 *                               network mid-flight).
 *
 * Both outcomes are user-visible successes. Only unexpected server
 * rejections propagate as an ApiError to `useMutation.onError`.
 *
 * Why not always enqueue first?
 *   Optimistically inserting into SQLite on every online submit gives
 *   marginal durability but *always* renders the row as "pending" for
 *   the ~200ms between insert and delete, muddying the sync UX. Instead
 *   we try the network first when we think we are online, and fall
 *   back to enqueue on the specific failure that would otherwise lose
 *   the write (network / fetch error).
 */

import { onlineManager } from '@tanstack/react-query';

import { ApiError } from '../api/client';
import { createExpense } from '../api/services/expenseService';
import { createPayment } from '../api/services/paymentService';
import type { Expense, Payment } from '@repo/shared/types/entities';
import type {
  CreateExpenseData,
  CreatePaymentData,
} from '@repo/shared/types/request';

import { enqueue, type OutboxType } from './outbox';
import { requestDrain } from './replay';

export type SubmitResult<T> =
  | { kind: 'sent'; data: T }
  | { kind: 'queued'; clientRequestId: string };

/**
 * True when the error looks like "the network never got there" —
 * fetch throws (`TypeError: Network request failed` on RN, or a
 * name === 'AbortError' on aborts) rather than surfacing an ApiError.
 * We use this as the sole trigger for the online→enqueue fallback so
 * we never silently swallow a server 4xx that the user should see.
 */
function isNetworkFailure(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  if (err instanceof Error) {
    // React Native fetch surfaces network unreachability as a TypeError
    // with either 'Network request failed' or the OS-level reason.
    return (
      err.name === 'TypeError' ||
      err.name === 'AbortError' ||
      /network|failed to fetch|timeout/i.test(err.message)
    );
  }
  return true;
}

interface CommonArgs {
  userId: string;
  clientRequestId: string;
}

export async function submitCreateExpense(
  payload: CreateExpenseData,
  { userId, clientRequestId }: CommonArgs,
): Promise<SubmitResult<Expense>> {
  return submit<Expense, CreateExpenseData>({
    userId,
    clientRequestId,
    type: 'expense.create',
    payload,
    send: () => createExpense(payload, { clientRequestId }),
  });
}

export async function submitCreatePayment(
  payload: CreatePaymentData,
  { userId, clientRequestId }: CommonArgs,
): Promise<SubmitResult<Payment>> {
  return submit<Payment, CreatePaymentData>({
    userId,
    clientRequestId,
    type: 'payment.create',
    payload,
    send: () => createPayment(payload, { clientRequestId }),
  });
}

interface SubmitArgs<TRes, TPayload> {
  userId: string;
  clientRequestId: string;
  type: OutboxType;
  payload: TPayload;
  send: () => Promise<TRes>;
}

async function submit<TRes, TPayload>(
  args: SubmitArgs<TRes, TPayload>,
): Promise<SubmitResult<TRes>> {
  const online = onlineManager.isOnline();

  if (!online) {
    await enqueue({
      id: args.clientRequestId,
      userId: args.userId,
      type: args.type,
      payload: args.payload,
    });
    // Kick the drain now — if connectivity flips between our
    // `isOnline()` check and this enqueue, the row lands and drains in
    // the same tick rather than waiting for the next event.
    requestDrain();
    return { kind: 'queued', clientRequestId: args.clientRequestId };
  }

  try {
    const data = await args.send();
    return { kind: 'sent', data };
  } catch (err) {
    if (isNetworkFailure(err)) {
      await enqueue({
        id: args.clientRequestId,
        userId: args.userId,
        type: args.type,
        payload: args.payload,
      });
      requestDrain();
      return { kind: 'queued', clientRequestId: args.clientRequestId };
    }
    throw err;
  }
}
