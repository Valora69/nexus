'use client';

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';

import { DEMO_EXPENSE, DEMO_MEMBERS, formatPeso } from '@web/lib/landing/demo';
import { LAPTOP_FADE_MS } from '@web/lib/landing/laptop-3d';
import type { DemoScenario } from '@web/lib/landing/simulated';
import { canUseWebGL } from '@web/lib/landing/webgl';
import { cn } from '@web/lib/utils';

import { CoinKey } from './coin-key';
import { HeroToasts, type HeroToast } from './hero-toasts';
import { TRACK_MEDIA_QUERY } from './landing-shell';
import { LaptopMock } from './laptop-mock';
import type { LedgerRow, SplitMode } from './laptop-screen';
import { useLandingSound } from './sound-provider';
import { useInView } from './use-in-view';
import { useMediaQuery } from './use-media-query';

// three.js and the 3D laptop are fetched only when useLaptop3d() passes, so
// phones, tablets and reduced-motion visitors never download them.
const Laptop3D = dynamic(() => import('./laptop-3d'), {
  ssr: false,
  loading: () => null,
});

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
 * Whether the hero gets the 3D laptop: the same desktop conditions as the
 * sideways track (lg+, mouse, motion allowed), then a GPU WebGL probe. False
 * on the server, in jsdom and until mount, so the CSS laptop renders first.
 */
export function useLaptop3d(): boolean {
  const desktop = useMediaQuery(TRACK_MEDIA_QUERY);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    if (desktop) setWebgl(canUseWebGL());
  }, [desktop]);

  return desktop && webgl;
}

/**
 * Catches anything the 3D laptop throws (chunk load, WebGL context, model
 * file, render) and hands back to the CSS laptop. The app has no error
 * boundary of its own, so without this a 3D failure would break the page.
 */
class Laptop3DBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The hero's interactive stage: owns the laptop ledger, the Add Expense
 * panel's member and split choices, the toast stack and the screen-reader
 * announcement, and wires the coin key into them. The state lives here, not
 * in the laptop, so swapping laptops keeps what the visitor picked.
 *
 * On desktop the CSS laptop shows first; once the 3D laptop has drawn
 * (front-on, in the same place) the two cross-fade, the CSS one unmounts and
 * the 3D one settles into its resting pose. Any 3D failure goes back to CSS.
 */
export function HeroStage() {
  const { play } = useLandingSound();
  const want3d = useLaptop3d();
  const [failed3d, setFailed3d] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const use3d = want3d && !failed3d;
  const { ref: boxRef, inView } = useInView<HTMLDivElement>();
  const [rows, setRows] = useState<LedgerRow[]>(SEED_ROWS);
  const [expense, setExpense] = useState<DemoScenario>({
    name: DEMO_EXPENSE.name,
    total: DEMO_EXPENSE.total,
  });
  const [selected, setSelected] = useState<string[]>(() =>
    DEMO_MEMBERS.map((m) => m.userId),
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [keyPresses, setKeyPresses] = useState(0);
  const [toasts, setToasts] = useState<HeroToast[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  // Leaving 3D (window narrowed, or WebGL failed) starts the swap over.
  useEffect(() => {
    if (use3d) return;
    setReady3d(false);
    setSwapped(false);
  }, [use3d]);

  // Once the 3D laptop has drawn: cross-fade, then drop the CSS laptop.
  useEffect(() => {
    if (!ready3d || swapped) return;
    const timer = window.setTimeout(() => setSwapped(true), LAPTOP_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [ready3d, swapped]);

  const handle3dReady = useCallback(() => setReady3d(true), []);
  const handle3dFail = useCallback(() => setFailed3d(true), []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, []);

  const toggleMember = useCallback(
    (userId: string) => {
      play('tap');
      setSelected((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId],
      );
    },
    [play],
  );

  const chooseMode = useCallback(
    (mode: SplitMode) => {
      if (mode === splitMode) return;
      play('tap');
      setSplitMode(mode);
    },
    [play, splitMode],
  );

  const handleAdd = useCallback((added: DemoScenario) => {
    nextId.current += 1;
    const id = nextId.current;
    setKeyPresses((count) => count + 1);

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

  const screen = {
    rows,
    expense,
    selected,
    splitMode,
    onToggleMember: toggleMember,
    onChooseMode: chooseMode,
  };
  const fadingOut = use3d && ready3d;

  return (
    // reducedMotion="user": no springs or slides for reduced-motion visitors.
    <MotionConfig reducedMotion="user">
      {/* The laptop is drawn at FRONT_VIEW's 723.4×519.7 and scaled; this
          box reserves the scaled size so nothing shifts. At lg+ it bleeds off the left edge
          far enough to hide the app's sidebar rail. On windows wider than
          1544px it stops bleeding, and the cap shrinks from 260px to 180px
          as the window widens, so the laptop moves toward the headline and
          the spaces on the far left and right stay closer to even. */}
      <div
        ref={boxRef}
        className="relative mx-auto mb-28 h-[244.3px] w-[340px] sm:mb-16 sm:h-[389.8px] sm:w-[542.6px] lg:mx-0 lg:-ml-[56px] lg:h-[405.4px] lg:w-[564.3px] xl:-ml-[min(calc((100vw-72rem)/2+1.5rem+40px),clamp(180px,646px-25vw,260px))] xl:h-[467.7px] xl:w-[651.1px]"
      >
        {use3d && (
          <Laptop3DBoundary onError={handle3dFail}>
            <Laptop3D
              {...screen}
              active={inView}
              shown={ready3d}
              settle={swapped}
              onReady={handle3dReady}
              onFail={handle3dFail}
              keyPresses={keyPresses}
            />
          </Laptop3DBoundary>
        )}
        {!(use3d && swapped) && (
          <LaptopMock
            {...screen}
            inactive={fadingOut}
            className={cn(
              'origin-top-left scale-[0.47] sm:scale-75 lg:scale-[0.78] xl:scale-90',
              fadingOut &&
                'opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            )}
          />
        )}
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
