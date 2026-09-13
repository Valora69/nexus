'use client';

import { useEffect, useRef, useState } from 'react';

import {
  createDemoRng,
  randomDemoExpense,
  type DemoScenario,
  type Rng,
} from '@web/lib/landing/simulated';
import { cn } from '@web/lib/utils';

import { useDemoActivity } from './demo-activity-provider';
import { HandNote } from './hand-note';
import { useLandingSound } from './sound-provider';

type CoinKeyProps = {
  onAdd: (expense: DemoScenario) => void;
  className?: string;
};

/**
 * Chunky ₱ keycap. Each press draws the next demo expense from a seeded PRNG,
 * clinks, and reports it to the hero and the page-wide demo activity.
 */
export function CoinKey({ onAdd, className }: CoinKeyProps) {
  const rng = useRef<Rng | null>(null);
  const previous = useRef<DemoScenario | undefined>(undefined);
  const [keyDown, setKeyDown] = useState(false);
  const { play } = useLandingSound();
  const { expenseAdded } = useDemoActivity();

  useEffect(() => {
    rng.current = createDemoRng();
  }, []);

  const press = () => {
    rng.current ??= createDemoRng();
    const expense = randomDemoExpense(rng.current, previous.current);
    previous.current = expense;
    play('coin');
    onAdd(expense);
    expenseAdded(expense.total);
  };

  return (
    <div className={cn('flex items-end gap-1', className)}>
      <HandNote direction="down-right" className="mb-2 hidden sm:flex">
        hey! tap to add
      </HandNote>
      <button
        type="button"
        aria-label="Add a demo expense"
        data-pressed={keyDown}
        onClick={press}
        // :active covers pointer presses; mirror it for Enter/Space.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setKeyDown(true);
        }}
        onKeyUp={() => setKeyDown(false)}
        onBlur={() => setKeyDown(false)}
        className="group relative h-[92px] w-[88px] shrink-0 touch-manipulation rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      >
        {/* Skirt: the darker body that shows below the face. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[80px] rounded-[24px] bg-[#0a5a1e] shadow-[0_18px_30px_-12px_rgb(0_255_65/0.45)] transition-shadow duration-100 group-active:shadow-[0_8px_16px_-10px_rgb(0_255_65/0.5)] group-data-[pressed=true]:shadow-[0_8px_16px_-10px_rgb(0_255_65/0.5)]"
        />
        {/* Face: presses down onto the skirt. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 flex h-[80px] items-center justify-center rounded-[24px] border border-white/30 bg-[linear-gradient(160deg,#7dff9a_0%,#00ff41_45%,#00c932_100%)] shadow-[inset_0_2px_0_rgb(255_255_255/0.55),inset_0_-6px_12px_rgb(0_80_20/0.35)] transition-transform duration-100 ease-out group-active:translate-y-[10px] group-data-[pressed=true]:translate-y-[10px]"
        >
          <span className="font-[family-name:var(--font-display)] text-[44px] font-extrabold leading-none text-black/85">
            ₱
          </span>
        </span>
      </button>
    </div>
  );
}
