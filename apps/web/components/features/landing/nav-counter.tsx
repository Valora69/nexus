'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';

import {
  QUICK_ADDS_ENDPOINT,
  QUICK_ADD_MAX_BATCH,
  readQuickAddCount,
} from '@web/lib/landing/quick-adds';
import { cn } from '@web/lib/utils';

import { useDemoActivityListener } from './demo-activity-provider';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** Re-read the shared total this often while the tab is visible. */
export const COUNTER_POLL_MS = 10_000;
/** Presses are batched into one request after this quiet gap. */
export const COUNTER_FLUSH_MS = 600;

const COUNT_FORMAT = { maximumFractionDigits: 0 } as const;
const countFormatter = new Intl.NumberFormat('en-PH', COUNT_FORMAT);

/**
 * Nav pill "1,204 quick adds": the real number of Quick Add presses (the
 * hero's Q keycap, clicked or typed) from every visitor, stored by
 * `/api/landing/quick-adds`. A press shows up right away; presses are sent in
 * small batches and the pill re-reads the shared total on a timer.
 */
export function NavCounter({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [server, setServer] = useState(0);
  const [unsent, setUnsent] = useState(0);
  const [bump, setBump] = useState(0);

  const queued = useRef(0);
  const inFlight = useRef(0);
  // Bumped by every send, so a read that started before it can't roll back.
  const sends = useRef(0);
  const flushTimer = useRef<number | undefined>(undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(flushTimer.current);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (typeof fetch !== 'function' || inFlight.current > 0) return;
    const startedAt = sends.current;
    try {
      const res = await fetch(QUICK_ADDS_ENDPOINT, { cache: 'no-store' });
      const count = res.ok ? readQuickAddCount(await res.json()) : null;
      if (count !== null && alive.current && sends.current === startedAt) {
        setServer(count);
      }
    } catch {
      // Offline or blocked: keep showing the last total.
    }
  }, []);

  const flush = useCallback(async () => {
    flushTimer.current = undefined;
    if (typeof fetch !== 'function' || inFlight.current > 0) return;
    const presses = Math.min(queued.current, QUICK_ADD_MAX_BATCH);
    if (presses <= 0) return;
    queued.current -= presses;
    inFlight.current = presses;
    sends.current += 1;
    try {
      const res = await fetch(QUICK_ADDS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presses }),
      });
      const count = res.ok ? readQuickAddCount(await res.json()) : null;
      if (count !== null && alive.current) setServer(count);
    } catch {
      // A failed batch is dropped; the shared total stays the source of truth.
    } finally {
      inFlight.current = 0;
      if (alive.current) {
        setUnsent(queued.current);
        if (queued.current > 0) {
          flushTimer.current = window.setTimeout(flush, COUNTER_FLUSH_MS);
        }
      }
    }
  }, []);

  // Read the total on load, then keep it fresh while the tab is visible.
  useEffect(() => {
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer !== undefined) return;
      void refresh();
      timer = window.setInterval(() => void refresh(), COUNTER_POLL_MS);
    };
    const sync = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      stop();
    };
  }, [refresh]);

  useDemoActivityListener((event) => {
    if (event.type !== 'quickAdded') return;
    queued.current += 1;
    setUnsent((n) => n + 1);
    setBump((b) => b + 1);
    window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(flush, COUNTER_FLUSH_MS);
  });

  const total = server + unsent;
  const unit = total === 1 ? 'quick add' : 'quick adds';

  return (
    <p
      data-nav-counter
      className={cn(
        'relative hidden h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border px-3 text-[13px] font-medium tracking-[-0.02em] text-muted md:inline-flex',
        className,
      )}
    >
      <span aria-hidden className="font-mono tabular-nums text-foreground">
        <NumberFlow
          value={total}
          locales="en-PH"
          format={COUNT_FORMAT}
          animated={!reduced}
        />
      </span>
      <span aria-hidden>{unit}</span>
      <span className="sr-only">
        {countFormatter.format(total)} {unit} so far
      </span>
      {bump > 0 && !reduced && (
        <motion.span
          key={bump}
          aria-hidden
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="pointer-events-none absolute inset-0 rounded-full border border-accent shadow-[0_0_14px_rgb(0_255_65/0.5)]"
        />
      )}
    </p>
  );
}
