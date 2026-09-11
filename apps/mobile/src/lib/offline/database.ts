/**
 * Single SQLite handle for the offline outbox.
 *
 * We keep this narrow — one table, one file — because the outbox is
 * decidedly *not* a mirror of the server database (see stage-12 plan).
 * A larger SQLite footprint invites drift and half-baked sync engines;
 * a single-table `outbox` cannot drift because it holds append-only
 * request payloads with a client-owned idempotency key, not domain rows.
 *
 * The handle is opened lazily and cached; every call site awaits
 * `getDb()` so the open cost is paid once per process. All statements
 * use the newer async API (`execAsync`, `runAsync`, `getAllAsync`) —
 * matches expo-sqlite ≥ 14 and avoids the older node-callback shape.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'moneyapp-offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Durable queue of append-only write intents (stage 12).
-- id             = clientRequestId (UUIDv4 from the mobile client) — also the
--                  Idempotency-Key sent to the server, so a replay of the
--                  same row can never double-write.
-- user_id        = the user that queued the row. Used to bound replay
--                  to the current session and to purge on sign-out — a
--                  device that switches accounts must not replay the
--                  previous user's writes under the new user's Bearer.
-- type           = 'expense.create' | 'payment.create'. Discriminator for
--                  the replay dispatcher.
-- payload        = JSON-serialized CreateExpenseData / CreatePaymentData.
-- status         = 'pending' | 'syncing' | 'failed'. 'done' rows are
--                  deleted rather than kept — the DB does not double as
--                  an audit log.
-- retry_count    = number of failed replay attempts so far (network /
--                  5xx). Drives exponential backoff and the terminal
--                  'failed' state after MAX_RETRIES.
-- last_error     = human-readable last failure message. Rendered in the
--                  outbox screen so a stuck row is diagnosable without
--                  attaching a debugger.
-- created_at     = epoch ms of first enqueue. Sort order for replay.
-- next_attempt_at= epoch ms; replay engine skips rows whose next attempt
--                  time hasn't arrived yet (backoff without spinning).
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  next_attempt_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS outbox_user_status_idx
  ON outbox(user_id, status, next_attempt_at);
`;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA_SQL);
      return db;
    })();
  }
  return dbPromise;
}

/**
 * Test-only helper: reset the cached handle. In production the handle
 * lives for the app's lifetime; there is no re-open path.
 */
export function __resetDbForTests(): void {
  dbPromise = null;
}
