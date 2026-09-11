/**
 * React hook for the sync-status strip / outbox screen: returns the
 * current user's pending/failed/syncing counts and re-renders whenever
 * the outbox notifies.
 *
 * Reads are async (SQLite is async by contract in expo-sqlite ≥ 14)
 * so we keep a local cache in state and re-query on every notify.
 * `null` means "not yet loaded" — call sites can treat it the same as
 * "no pending work" and swap in the real number when it arrives.
 */

import { useEffect, useState } from 'react';

import { useAuth } from '../auth/auth-context';

import { countsForUser, listForUser, subscribeOutbox, type OutboxCounts, type OutboxRow } from './outbox';

export function useOutboxCounts(): OutboxCounts | null {
  const { user } = useAuth();
  const [counts, setCounts] = useState<OutboxCounts | null>(null);

  useEffect(() => {
    if (!user) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    const userId = user.sub;
    async function refresh(): Promise<void> {
      try {
        const next = await countsForUser(userId);
        if (!cancelled) setCounts(next);
      } catch {
        // Non-fatal — the strip just won't update this tick.
      }
    }
    void refresh();
    const unsub = subscribeOutbox(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  return counts;
}

export function useOutboxRows(): OutboxRow[] {
  const { user } = useAuth();
  const [rows, setRows] = useState<OutboxRow[]>([]);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const userId = user.sub;
    async function refresh(): Promise<void> {
      try {
        const next = await listForUser(userId);
        if (!cancelled) setRows(next);
      } catch {
        // Ignore transient read failures.
      }
    }
    void refresh();
    const unsub = subscribeOutbox(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  return rows;
}
