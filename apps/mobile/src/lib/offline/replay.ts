/**
 * Replay engine: drains the outbox against the server whenever the
 * device thinks it can reach the network.
 *
 * The engine is deliberately sequential (one row at a time). The two
 * queued actions — `expense.create` and `payment.create` — both mutate
 * shared server state, and the payment path takes a row-level lock on
 * the split it targets. Draining in parallel would either serialize in
 * the DB anyway or spawn contention we can trivially avoid client-side.
 *
 * Retry policy:
 *   - Network / transient errors: exponential backoff (1s, 2s, 4s, 8s,
 *     16s, 32s, capped at 60s), up to MAX_RETRIES. After that the row
 *     is marked `failed` and stays visible in the outbox screen for the
 *     user to retry or discard.
 *   - Server 4xx (except 401): row is marked `failed` immediately —
 *     no amount of retrying will fix a validation reject or a permission
 *     denial. The user sees the error and decides what to do.
 *   - 401: the auth context will clear the session on the next request
 *     that produced it; the replay engine pauses in the meantime because
 *     the current user changes and the outbox is user-scoped.
 *
 * The engine is a plain module singleton — `start(userId)` binds it to
 * the signed-in user; `stop()` releases it on sign-out. Only one user's
 * queue drains at a time; queueing for user A and signing in as B does
 * not accidentally send A's writes under B's Bearer.
 */

import { onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

import { ApiError } from '../api/client';
import { queryClient } from '../api/query-client';
import { invalidateExpenseDomain, invalidatePaymentDomain } from '../api/invalidations';
import { createExpense } from '../api/services/expenseService';
import { createPayment } from '../api/services/paymentService';
import {
  bumpRetryAndReschedule,
  listDueForUser,
  markFailed,
  markPending,
  markSyncing,
  deleteRow,
  type OutboxRow,
} from './outbox';

const MAX_RETRIES = 6;
const BACKOFF_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 60_000];

let currentUserId: string | null = null;
let running = false;
let drainScheduled = false;
let unsubOnline: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;

/**
 * Bind the engine to a signed-in user and kick a first drain. Wired to
 * NetInfo (online transitions) and AppState (foreground) so the queue
 * shrinks on every reasonable connectivity signal without polling.
 */
export function startReplay(userId: string): void {
  if (currentUserId === userId && unsubOnline) return;
  stopReplay();
  currentUserId = userId;

  unsubOnline = onlineManager.subscribe((isOnline) => {
    if (isOnline) void scheduleDrain();
  });

  const onAppState = (state: AppStateStatus) => {
    if (state === 'active') void scheduleDrain();
  };
  appStateSub = AppState.addEventListener('change', onAppState);

  // Kick an initial drain — the app might have launched while offline or
  // with pending rows from a prior session.
  void scheduleDrain();
}

export function stopReplay(): void {
  currentUserId = null;
  unsubOnline?.();
  unsubOnline = null;
  appStateSub?.remove();
  appStateSub = null;
}

/**
 * Manual trigger (used by the outbox screen's retry button, and by the
 * submit helper immediately after enqueue in case the caller misjudged
 * connectivity between `isOnline()` and their request).
 */
export function requestDrain(): void {
  void scheduleDrain();
}

async function scheduleDrain(): Promise<void> {
  if (drainScheduled || running) return;
  drainScheduled = true;
  // Deferred by a microtask so a burst of triggers (online → foreground
  // → manual retry) collapses to one drain pass.
  await Promise.resolve();
  drainScheduled = false;
  if (running) return;
  if (!currentUserId) return;
  if (!onlineManager.isOnline()) return;
  running = true;
  try {
    await drainNow(currentUserId);
  } finally {
    running = false;
  }
}

async function drainNow(userId: string): Promise<void> {
  // Loop until the queue is empty *or* we hit a still-online-but-failed
  // row — then bail so a spike of transient errors doesn't monopolize
  // the JS thread. The next connectivity/foreground event kicks another
  // pass; between passes the UI stays responsive.
  //
  // biome-ignore lint/style/noUnusedLabels: readable break target
  outer: while (true) {
    if (userId !== currentUserId) return; // signed out mid-drain
    if (!onlineManager.isOnline()) return;

    const due = await listDueForUser(userId);
    if (due.length === 0) return;

    for (const row of due) {
      if (userId !== currentUserId) return;
      if (!onlineManager.isOnline()) return;

      const outcome = await sendOne(row);
      if (outcome === 'giveUp') break outer;
      // 'ok' and 'retry' → continue the inner loop; the next iteration
      // of `outer` will re-query in case new rows were enqueued while
      // we were sending.
    }
  }
}

type SendOutcome = 'ok' | 'retry' | 'giveUp';

async function sendOne(row: OutboxRow): Promise<SendOutcome> {
  await markSyncing(row.id);

  try {
    if (row.type === 'expense.create') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createExpense(row.payload as any, { clientRequestId: row.id });
      await deleteRow(row.id);
      invalidateExpenseDomain(queryClient);
      return 'ok';
    }
    if (row.type === 'payment.create') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createPayment(row.payload as any, { clientRequestId: row.id });
      await deleteRow(row.id);
      invalidatePaymentDomain(queryClient);
      return 'ok';
    }
    // Unknown row type — never legitimate; mark failed so a stale build
    // doesn't spin forever trying to send data the current code cannot
    // interpret.
    await markFailed(row.id, `Unknown outbox row type: ${row.type}`, {
      incrementRetry: false,
    });
    return 'giveUp';
  } catch (err) {
    return handleSendError(row, err);
  }
}

async function handleSendError(
  row: OutboxRow,
  err: unknown,
): Promise<SendOutcome> {
  if (err instanceof ApiError) {
    // 401 → auth context will clear the session; leave the row pending
    // so it can drain after the next sign-in of the *same* user (rows
    // for other users are already partitioned out by `listDueForUser`).
    if (err.status === 401) {
      await markPending(row.id, Date.now() + 5_000);
      return 'giveUp';
    }
    // Any other 4xx = permanent, from the outbox's perspective. A
    // 400/403/404/409 means the server rejected this specific write and
    // retrying with the same payload will produce the same rejection.
    if (err.status >= 400 && err.status < 500) {
      await markFailed(row.id, err.message, { incrementRetry: false });
      return 'retry';
    }
    // 5xx = server-side transient. Fall through to the backoff path.
  }

  // Network error or 5xx → transient. Increment the retry counter; if we
  // are past the ceiling, park the row as `failed` for the user to look
  // at. Otherwise back it off to `pending` with a future next_attempt_at
  // so this drain pass does not pick it up again.
  const message = err instanceof Error ? err.message : String(err);
  const nextRetry = row.retryCount + 1;
  if (nextRetry >= MAX_RETRIES) {
    await markFailed(row.id, message, { incrementRetry: true });
    return 'retry';
  }
  const delay = BACKOFF_MS[Math.min(nextRetry, BACKOFF_MS.length - 1)];
  await bumpRetryAndReschedule(row.id, message, Date.now() + delay);
  return 'retry';
}
