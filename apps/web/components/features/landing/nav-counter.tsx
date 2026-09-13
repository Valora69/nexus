'use client';

import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';

import {
  COUNTER_BASE,
  createDemoRng,
  nextCounterStep,
  type Rng,
} from '@web/lib/landing/simulated';
import { cn } from '@web/lib/utils';

import { useDemoActivityListener } from './demo-activity-provider';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** One simulated tick this often, while the tab is visible. */
export const COUNTER_TICK_MS = 3000;

const COUNT_FORMAT = { maximumFractionDigits: 0 } as const;
const countFormatter = new Intl.NumberFormat('en-PH', COUNT_FORMAT);

/**
 * Nav pill "₱ 12,408,550 split · demo": a simulated running total that rolls
 * up on a timer and jumps when the visitor adds an expense or sends a
 * payment. Always labeled demo; there's no backend behind it.
 */
export function NavCounter({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [total, setTotal] = useState(COUNTER_BASE);
  const [bump, setBump] = useState(0);
  const rng = useRef<Rng | null>(null);

  // Tick only while the tab is visible.
  useEffect(() => {
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(() => {
        rng.current ??= createDemoRng();
        const step = nextCounterStep(rng.current);
        setTotal((t) => t + step);
      }, COUNTER_TICK_MS);
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
  }, []);

  useDemoActivityListener((event) => {
    setTotal((t) => t + event.amount);
    setBump((b) => b + 1);
  });

  return (
    <p
      data-nav-counter
      className={cn(
        'relative hidden h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border px-3 text-[13px] font-medium tracking-[-0.02em] text-muted md:inline-flex',
        className,
      )}
    >
      <span aria-hidden className="font-mono tabular-nums text-foreground">
        ₱{' '}
        <NumberFlow
          value={total}
          locales="en-PH"
          format={COUNT_FORMAT}
          animated={!reduced}
        />
      </span>
      <span aria-hidden>split</span>
      <span
        aria-hidden
        className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-accent"
      >
        demo
      </span>
      <span className="sr-only">
        Demo counter, simulated: ₱{countFormatter.format(total)} split
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
