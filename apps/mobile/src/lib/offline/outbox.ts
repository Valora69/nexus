/**
 * Outbox: the durable append-only queue behind stage-12 offline writes.
 *
 * The public surface is deliberately small — CRUD plus a subscribe hook
 * for the UI. Everything higher-level (deciding online vs offline,
 * building payloads, driving replay) lives in sibling modules so this
 * one can stay a plain data-access layer.
 *
 * Rows carry a `user_id` so a device that signs out mid-queue cannot
 * accidentally replay the previous session's writes under the new
 * user's Bearer token — the classic mobile bug this outbox is written
 * to avoid. Every list/count/delete API takes the current userId.
 */

import { getDb } from './database';

export type OutboxType = 'expense.create' | 'payment.create';
export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxRow {
  id: string;
  userId: string;
  type: OutboxType;
  /** Parsed payload — callers should not touch the raw JSON string. */
  payload: unknown;
  status: OutboxStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: number;
  nextAttemptAt: number;
}

interface RawRow {
  id: string;
  user_id: string;
  type: string;
  payload: string;
  status: string;
  retry_count: number;
  last_error: string | null;
  created_at: number;
  next_attempt_at: number;
}

function decode(row: RawRow): OutboxRow {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as OutboxType,
    payload: JSON.parse(row.payload),
    status: row.status as OutboxStatus,
    retryCount: row.retry_count,
    lastError: row.last_error,
    createdAt: row.created_at,
    nextAttemptAt: row.next_attempt_at,
  };
}

// ---------------------------------------------------------------------------
// Subscribers — a tiny listener registry so the sync-status strip and the
// outbox screen can re-render when the queue changes without either
// polling or wiring in a reactive DB adapter.
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeOutbox(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  // Snapshot before iterating so a listener that unsubscribes inside
  // its own callback doesn't skip the next entry.
  for (const l of Array.from(listeners)) l();
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface EnqueueInput {
  id: string; // clientRequestId (UUIDv4)
  userId: string;
  type: OutboxType;
  payload: unknown;
}

export async function enqueue(input: EnqueueInput): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO outbox
       (id, user_id, type, payload, status, retry_count, last_error, created_at, next_attempt_at)
     VALUES (?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
    input.id,
    input.userId,
    input.type,
    JSON.stringify(input.payload),
    now,
    now,
  );
  notify();
}

export async function markSyncing(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outbox SET status = 'syncing', last_error = NULL WHERE id = ?`,
    id,
  );
  notify();
}

export async function markPending(id: string, nextAttemptAt: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outbox SET status = 'pending', next_attempt_at = ? WHERE id = ?`,
    nextAttemptAt,
    id,
  );
  notify();
}

export async function markFailed(
  id: string,
  message: string,
  { incrementRetry }: { incrementRetry: boolean } = { incrementRetry: true },
): Promise<void> {
  const db = await getDb();
  if (incrementRetry) {
    await db.runAsync(
      `UPDATE outbox
          SET status = 'failed', last_error = ?, retry_count = retry_count + 1
        WHERE id = ?`,
      message,
      id,
    );
  } else {
    await db.runAsync(
      `UPDATE outbox SET status = 'failed', last_error = ? WHERE id = ?`,
      message,
      id,
    );
  }
  notify();
}

/** Move a `failed` row back to `pending` for another try. */
export async function retryRow(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outbox SET status = 'pending', last_error = NULL, next_attempt_at = ? WHERE id = ?`,
    Date.now(),
    id,
  );
  notify();
}

export async function deleteRow(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM outbox WHERE id = ?`, id);
  notify();
}

/**
 * Transient-failure path: bump `retry_count`, record the error message,
 * and reschedule the row to `pending` at `nextAttemptAt`. One SQL
 * statement so an in-progress crash can never leave a row half-updated
 * (e.g. marked failed with a fresh retry count).
 */
export async function bumpRetryAndReschedule(
  id: string,
  message: string,
  nextAttemptAt: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outbox
        SET status = 'pending',
            retry_count = retry_count + 1,
            last_error = ?,
            next_attempt_at = ?
      WHERE id = ?`,
    message,
    nextAttemptAt,
    id,
  );
  notify();
}

/**
 * Purge every row belonging to a specific user. Called on sign-out so
 * the next account can't inherit the previous session's queued writes.
 * Returns the number of rows removed for caller UX (confirmation dialog).
 */
export async function deleteAllForUser(userId: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(`DELETE FROM outbox WHERE user_id = ?`, userId);
  notify();
  return result.changes;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listForUser(userId: string): Promise<OutboxRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM outbox WHERE user_id = ? ORDER BY created_at ASC`,
    userId,
  );
  return rows.map(decode);
}

export async function listDueForUser(userId: string): Promise<OutboxRow[]> {
  const db = await getDb();
  const now = Date.now();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM outbox
       WHERE user_id = ?
         AND status = 'pending'
         AND next_attempt_at <= ?
       ORDER BY created_at ASC`,
    userId,
    now,
  );
  return rows.map(decode);
}

export interface OutboxCounts {
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}

export async function countsForUser(userId: string): Promise<OutboxCounts> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ status: string; n: number }>(
    `SELECT status, COUNT(*) as n FROM outbox WHERE user_id = ? GROUP BY status`,
    userId,
  );
  const counts: OutboxCounts = { pending: 0, syncing: 0, failed: 0, total: 0 };
  for (const row of rows) {
    if (row.status === 'pending') counts.pending = row.n;
    else if (row.status === 'syncing') counts.syncing = row.n;
    else if (row.status === 'failed') counts.failed = row.n;
    counts.total += row.n;
  }
  return counts;
}
