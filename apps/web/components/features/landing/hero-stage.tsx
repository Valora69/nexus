'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';

import { DEMO_EXPENSE, formatPeso } from '@web/lib/landing/demo';
import type { DemoScenario } from '@web/lib/landing/simulated';

import { CoinKey } from './coin-key';
import { HeroToasts, type HeroToast } from './hero-toasts';
import { LaptopMock, type LedgerRow } from './laptop-mock';

export const HERO_MAX_ROWS = 5;
export const HERO_MAX_TOASTS = 3;
export const HERO_TOAST_MS = 3200;

const SEED_ROWS: LedgerRow[] = [
  { id: 'seed-pizza', name: 'Pizza night', total: 1200, payer: 'You' },
  { id: 'seed-grab', name: 'Grab home', total: 240, payer: 'Migs' },
  { id: 'seed-milk-tea', name: 'Milk tea run', total: 390, payer: 'Job' },
];

/** ₱1,200 rather than ₱1,200.00, for announcements. */
function formatPesoShort(amount: number) {
  return formatPeso(amount).replace(/\.00$/, '');
}

/**
 * The hero's interactive stage: owns the laptop ledger, the toast stack and
 * the screen-reader announcement, and wires the coin key into all three.
 */
export function HeroStage() {
  const [rows, setRows] = useState<LedgerRow[]>(SEED_ROWS);
  const [expense, setExpense] = useState<DemoScenario>({
    name: DEMO_EXPENSE.name,
    total: DEMO_EXPENSE.total,
  });
  const [toasts, setToasts] = useState<HeroToast[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, []);

  const handleAdd = useCallback((added: DemoScenario) => {
    nextId.current += 1;
    const id = nextId.current;

    setRows((prev) =>
      [
        {
          id: `added-${id}`,
          name: added.name,
          total: added.total,
          payer: 'You',
          isNew: true,
        },
        ...prev,
      ].slice(0, HERO_MAX_ROWS),
    );
    setExpense(added);
    setToasts((prev) =>
      [...prev, { id, amount: added.total }].slice(-HERO_MAX_TOASTS),
    );
    setAnnouncement(`Added ${added.name} ${formatPesoShort(added.total)}`);

    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, HERO_TOAST_MS);
    timers.current.add(timer);
  }, []);

  return (
    // reducedMotion="user": no springs or slides for reduced-motion visitors.
    <MotionConfig reducedMotion="user">
      {/* The laptop is drawn at 720×466 and scaled; this box reserves the
          scaled size so nothing shifts. At lg+ it bleeds off the left edge
          far enough to hide the app's sidebar rail. */}
      <div className="relative mx-auto mb-28 h-[219px] w-[338px] sm:mb-16 sm:h-[350px] sm:w-[540px] lg:mx-0 lg:-ml-[56px] lg:h-[364px] lg:w-[562px] xl:-ml-[min(calc((100vw-72rem)/2+1.5rem+40px),260px)] xl:h-[420px] xl:w-[648px]">
        <LaptopMock
          rows={rows}
          expense={expense}
          className="origin-top-left scale-[0.47] sm:scale-75 lg:scale-[0.78] xl:scale-90"
        />
        <HeroToasts
          toasts={toasts}
          className="absolute bottom-[52px] right-0 z-20 sm:bottom-[64px] sm:right-4"
        />
        <CoinKey
          onAdd={handleAdd}
          className="absolute right-2 top-full z-20 -mt-3 sm:right-8 sm:-mt-10"
        />
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}
