'use client';

import { useEffect, useId, useRef, useState } from 'react';

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

// Mirrors QUICK_ADD_KEY in components/layout/quick-add-button.tsx, copied so
// the landing bundle doesn't pull in the app's layout code.
const QUICK_ADD_KEY = 'q';

type CoinKeyProps = {
  onAdd: (expense: DemoScenario) => void;
  className?: string;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

/**
 * A sculpted mechanical keycap with a "Q" legend, the app's Quick Add
 * key, and a green handwritten note whose arrow points at it. Clicking it, or
 * pressing Q on the page, draws the next demo expense from a seeded PRNG,
 * clicks, and reports it to the hero and the page-wide demo activity (the nav
 * counts every press).
 */
export function CoinKey({ onAdd, className }: CoinKeyProps) {
  const rng = useRef<Rng | null>(null);
  const previous = useRef<DemoScenario | undefined>(undefined);
  const [keyDown, setKeyDown] = useState(false);
  const { play } = useLandingSound();
  const { expenseAdded, quickAdded } = useDemoActivity();

  useEffect(() => {
    rng.current = createDemoRng();
  }, []);

  const press = () => {
    rng.current ??= createDemoRng();
    const expense = randomDemoExpense(rng.current, previous.current);
    previous.current = expense;
    play('tap');
    onAdd(expense);
    expenseAdded(expense.total);
    quickAdded();
  };

  // Keep the latest press for the window listener without re-subscribing.
  const pressRef = useRef(press);
  pressRef.current = press;

  // The physical Q key presses the keycap, as Quick Add does in the app.
  useEffect(() => {
    const isQuickAdd = (e: KeyboardEvent) =>
      e.key.toLowerCase() === QUICK_ADD_KEY &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !isTypingTarget(e.target);

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isQuickAdd(e) || e.repeat) return;
      setKeyDown(true);
      pressRef.current();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === QUICK_ADD_KEY) setKeyDown(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // SVG ids must be unique per instance; useId's colons break url(#…).
  const uid = useId().replace(/:/g, '');
  const ids = {
    body: `${uid}-body`,
    sides: `${uid}-sides`,
    skirt: `${uid}-skirt`,
    face: `${uid}-face`,
    dish: `${uid}-dish`,
    blur: `${uid}-blur`,
  };

  return (
    <div className={cn('flex items-end gap-1', className)}>
      <HandNote direction="down-right" className="mb-2 hidden sm:flex">
        hey! tap to add
      </HandNote>
      <button
        type="button"
        aria-label="Add a demo expense"
        aria-keyshortcuts="Q"
        data-pressed={keyDown}
        onClick={press}
        // :active covers pointer presses; mirror it for Enter/Space.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setKeyDown(true);
        }}
        onKeyUp={() => setKeyDown(false)}
        onBlur={() => setKeyDown(false)}
        // Keycap press: the whole cap squashes toward its base.
        className="relative h-[93px] w-[96px] shrink-0 origin-bottom touch-manipulation select-none rounded-[22px] outline-none transition-transform duration-100 active:scale-95 data-[pressed=true]:scale-95 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      >
        {/* A cap in perspective: a dished top face on a body that flares to
            a wider base, so the side walls and front skirt show. Matte-ish:
            only faint highlights, a dark drop shadow, no colored halo. */}
        <svg
          aria-hidden
          viewBox="0 0 120 116"
          className="h-full w-full overflow-visible drop-shadow-[0_10px_12px_rgb(0_0_0/0.8)]"
        >
          <defs>
            <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00d136" />
              <stop offset="0.55" stopColor="#00a82b" />
              <stop offset="1" stopColor="#005f18" />
            </linearGradient>
            <linearGradient id={ids.sides} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#00280a" stopOpacity="0.35" />
              <stop offset="0.16" stopColor="#00280a" stopOpacity="0" />
              <stop offset="0.84" stopColor="#00280a" stopOpacity="0" />
              <stop offset="1" stopColor="#00280a" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id={ids.skirt} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00b52e" />
              <stop offset="1" stopColor="#004d13" />
            </linearGradient>
            <radialGradient id={ids.face} cx="0.32" cy="0.18" r="0.95">
              <stop offset="0" stopColor="#4ef57a" />
              <stop offset="0.35" stopColor="#1ee552" />
              <stop offset="0.7" stopColor="#00d136" />
              <stop offset="1" stopColor="#00b52e" />
            </radialGradient>
            <radialGradient id={ids.dish} cx="0.5" cy="0.62" r="0.6">
              <stop offset="0" stopColor="#005014" stopOpacity="0.2" />
              <stop offset="1" stopColor="#005014" stopOpacity="0" />
            </radialGradient>
            <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Body, flaring out toward the base. */}
          <path
            d="M24 4 H96 C106 4 111 9 112 19 L116 90 C117 106 110 112 98 112 H22 C10 112 3 106 4 90 L8 19 C9 9 14 4 24 4 Z"
            fill={`url(#${ids.body})`}
          />
          <path
            d="M24 4 H96 C106 4 111 9 112 19 L116 90 C117 106 110 112 98 112 H22 C10 112 3 106 4 90 L8 19 C9 9 14 4 24 4 Z"
            fill={`url(#${ids.sides})`}
          />
          {/* Faint streaks down each side wall. */}
          <path
            d="M11 26 L7 88"
            stroke="#ffffff"
            strokeOpacity="0.1"
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#${ids.blur})`}
          />
          <path
            d="M109 26 L113 88"
            stroke="#ffffff"
            strokeOpacity="0.06"
            strokeWidth="2"
            strokeLinecap="round"
            filter={`url(#${ids.blur})`}
          />
          {/* Front skirt below the face. */}
          <path
            d="M21 72 H99 L113 94 C114 107 108 112 98 112 H22 C12 112 6 107 7 94 Z"
            fill={`url(#${ids.skirt})`}
            opacity="0.9"
          />
          {/* Soft reflection along the front of the skirt. */}
          <ellipse
            cx="60"
            cy="102"
            rx="30"
            ry="3.5"
            fill="#ffffff"
            opacity="0.06"
            filter={`url(#${ids.blur})`}
          />
          {/* Top face with a shallow dish. */}
          <rect
            x="18"
            y="7"
            width="84"
            height="68"
            rx="17"
            fill={`url(#${ids.face})`}
          />
          <rect
            x="18"
            y="7"
            width="84"
            height="68"
            rx="17"
            fill={`url(#${ids.dish})`}
          />
          <rect
            x="18.5"
            y="7.5"
            width="83"
            height="67"
            rx="16.5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.15"
          />
          {/* A hint of sheen, not a light reflection. */}
          <ellipse
            cx="42"
            cy="18"
            rx="18"
            ry="5"
            fill="#ffffff"
            opacity="0.1"
            filter={`url(#${ids.blur})`}
          />
          <text
            x="60"
            y="53"
            textAnchor="middle"
            fill="#04200c"
            fontSize="34"
            fontWeight="800"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Q
          </text>
        </svg>
      </button>
    </div>
  );
}
