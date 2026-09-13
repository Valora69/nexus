'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { MotionConfig, animate, motion, useMotionValue } from 'motion/react';

import {
  DEMO_EXPENSE,
  DEMO_MEMBERS,
  SLICE_STEP,
  customValidity,
  dividerBounds,
  equalDividers,
  formatPeso,
  moveDivider,
  sharesFromDividers,
} from '@web/lib/landing/demo';

import { HandNote } from './hand-note';
import { PesoFlow } from './peso-flow';
import { useLandingSound } from './sound-provider';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** Minimum gap between drag ticks, so a fast drag stays a patter. */
const TICK_COOLDOWN_MS = 45;
const PAGE_STEP = SLICE_STEP * 10;

const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;
// Stiffer and overdamped for the segments and wedges: no overshoot, so they
// never cross while catching up with a divider.
const FOLLOW = { type: 'spring', stiffness: 420, damping: 42 } as const;

const TOTAL = DEMO_EXPENSE.total;

const PEOPLE = DEMO_EXPENSE.participantIds.map((id) => ({
  userId: id,
  name: DEMO_MEMBERS.find((m) => m.userId === id)?.name ?? id,
}));

// Neon, mid and deep green, so neighbours always read apart on black.
const SLICE_COLORS = [
  { fill: '#00ff41', text: '#021a08' },
  { fill: '#00a82b', text: '#021a08' },
  { fill: '#0b5d20', text: '#e8ffee' },
  { fill: '#b8ffca', text: '#021a08' },
];

const colorAt = (i: number) =>
  SLICE_COLORS[i % SLICE_COLORS.length] ?? SLICE_COLORS[0]!;

/** Eases an array of numbers toward `target`, for segments and wedges. */
function useFollow(target: number[], instant: boolean): number[] {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    const same =
      from.length === target.length && from.every((v, i) => v === target[i]);
    if (same) return;
    if (instant) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const controls = animate(0, 1, {
      ...FOLLOW,
      onUpdate: (p) => {
        const next = target.map((t, i) => {
          const start = from[i] ?? t;
          return start + (t - start) * p;
        });
        shownRef.current = next;
        setShown(next);
      },
    });
    return () => controls.stop();
  }, [target, instant]);

  return shown;
}

function wedgePath(startAngle: number, endAngle: number, r: number) {
  const point = (a: number) =>
    `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M100 100 L${point(startAngle)} A${r} ${r} 0 ${large} 1 ${point(endAngle)} Z`;
}

function Pizza({ shares }: { shares: number[] }) {
  let angle = -Math.PI / 2;
  const wedges = shares.map((share, i) => {
    const sweep = TOTAL > 0 ? (share / TOTAL) * Math.PI * 2 : 0;
    const start = angle;
    angle += sweep;
    const mid = start + sweep / 2;
    return { i, start, end: angle, mid, sweep };
  });

  return (
    <svg aria-hidden viewBox="0 0 200 200" className="h-full w-full">
      <circle cx={100} cy={100} r={94} fill="#1a1a1a" />
      {/* A ₱0 share has no wedge at all. */}
      {wedges
        .filter((w) => w.sweep > 0.001)
        .map((w) => (
          <g key={w.i}>
            {/* One person with the whole bill: an arc can't draw a full
              circle, so draw the circle itself. */}
            {w.sweep >= Math.PI * 2 - 0.001 ? (
              <circle
                cx={100}
                cy={100}
                r={88}
                fill={colorAt(w.i).fill}
                stroke="#000"
                strokeWidth={3}
              />
            ) : (
              <path
                d={wedgePath(w.start, w.end, 88)}
                fill={colorAt(w.i).fill}
                stroke="#000"
                strokeWidth={3}
                strokeLinejoin="round"
              />
            )}
            {/* A couple of toppings, only once the slice has room for them. */}
            {w.sweep > 0.45 &&
              [0.45, 0.72].map((radius, j) => (
                <circle
                  key={radius}
                  cx={
                    100 +
                    88 * radius * Math.cos(w.mid + (j === 0 ? -0.18 : 0.14))
                  }
                  cy={
                    100 +
                    88 * radius * Math.sin(w.mid + (j === 0 ? -0.18 : 0.14))
                  }
                  r={6}
                  fill="#000"
                  opacity={0.22}
                />
              ))}
          </g>
        ))}
    </svg>
  );
}

type DividerHandleProps = {
  index: number;
  value: number;
  dividers: number[];
  width: number;
  leftName: string;
  rightName: string;
  leftShare: number;
  rightShare: number;
  reduced: boolean;
  onMove: (index: number, pesos: number) => void;
  onRelease: () => void;
};

function DividerHandle({
  index,
  value,
  dividers,
  width,
  leftName,
  rightName,
  leftShare,
  rightShare,
  reduced,
  onMove,
  onRelease,
}: DividerHandleProps) {
  const x = useMotionValue(0);
  const dragging = useRef(false);
  const pxPerPeso = TOTAL > 0 ? width / TOTAL : 0;
  const { min, max } = dividerBounds(TOTAL, dividers, index);

  // Glide to the snapped position whenever the value changes from outside a
  // drag (arrow keys, Divide Equally, a resize) and after each release.
  const settle = useCallback(() => {
    const target = value * pxPerPeso;
    if (reduced) {
      x.set(target);
      return undefined;
    }
    return animate(x, target, SPRING);
  }, [value, pxPerPeso, reduced, x]);

  useEffect(() => {
    if (dragging.current) return;
    const controls = settle();
    return () => controls?.stop();
  }, [settle]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next: Record<string, number> = {
      ArrowLeft: value - SLICE_STEP,
      ArrowDown: value - SLICE_STEP,
      ArrowRight: value + SLICE_STEP,
      ArrowUp: value + SLICE_STEP,
      PageDown: value - PAGE_STEP,
      PageUp: value + PAGE_STEP,
      Home: min,
      End: max,
    };
    const target = next[e.key];
    if (target === undefined) return;
    e.preventDefault();
    onMove(index, target);
  };

  return (
    <motion.div
      role="slider"
      tabIndex={0}
      // Dragging has its own notch sound, not the page-wide click.
      data-landing-no-click
      aria-label={`Divider between ${leftName} and ${rightName}`}
      aria-orientation="horizontal"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${leftName} ${formatPeso(leftShare)}, ${rightName} ${formatPeso(rightShare)}`}
      drag={width > 0 ? 'x' : false}
      dragConstraints={{ left: min * pxPerPeso, right: max * pxPerPeso }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => {
        dragging.current = true;
      }}
      onDrag={() => {
        if (pxPerPeso > 0) onMove(index, x.get() / pxPerPeso);
      }}
      onDragEnd={() => {
        dragging.current = false;
        settle();
        onRelease();
      }}
      onKeyDown={handleKeyDown}
      // Two dividers can sit on the same spot once a share is ₱0. Stack the
      // one that can still move on top: the lower index near the right end,
      // the higher index anywhere else.
      style={{
        x,
        zIndex:
          TOTAL > 0 && value > TOTAL / 2 ? dividers.length - index : index + 1,
      }}
      // drag="x" writes an inline touch-action: pan-y; !touch-none wins over
      // it, so a touch drag never scrolls the page instead.
      className="group/handle !touch-none absolute inset-y-[-10px] left-0 -ml-5 flex w-10 cursor-ew-resize items-center justify-center rounded-full outline-none"
    >
      <span className="h-full w-[3px] rounded-full bg-black" />
      <span className="absolute flex h-9 w-6 items-center justify-center gap-[3px] rounded-full border border-white/20 bg-[#111] shadow-[0_4px_12px_rgb(0_0_0/0.8)] transition-transform group-hover/handle:scale-110 group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-white group-active/handle:scale-95">
        <span className="h-3.5 w-px bg-white/60" />
        <span className="h-3.5 w-px bg-white/60" />
      </span>
    </motion.div>
  );
}

/**
 * "Slice the bill.": the bill as a bar with a draggable divider between each
 * person (snapping to ₱10) and a pizza whose wedges follow. Shares come from
 * `sharesFromDividers`, so they always add up to the bill; a share can be ₱0,
 * which the app treats as excluded.
 */
export function BillSlicer() {
  const { play } = useLandingSound();
  const reduced = usePrefersReducedMotion();
  const [dividers, setDividers] = useState(() =>
    equalDividers(TOTAL, PEOPLE.length),
  );
  const [width, setWidth] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const lastTick = useRef(-Infinity);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const measure = () => setWidth(bar.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const shares = sharesFromDividers(TOTAL, dividers);
  const shown = sharesFromDividers(TOTAL, useFollow(dividers, reduced));
  const check = customValidity(
    TOTAL,
    Object.fromEntries(PEOPLE.map((p, i) => [p.userId, shares[i] ?? 0])),
  );

  const describe = (values: number[]) =>
    PEOPLE.map((p, i) => `${p.name} ${formatPeso(values[i] ?? 0)}`).join(', ');

  const handleMove = (index: number, pesos: number) => {
    setDividers((prev) => {
      const next = moveDivider(TOTAL, prev, index, pesos);
      if (next[index] === prev[index]) return prev;
      const now = performance.now();
      if (now - lastTick.current >= TICK_COOLDOWN_MS) {
        lastTick.current = now;
        play('notch');
      }
      return next;
    });
  };

  const divideEqually = () => {
    const next = equalDividers(TOTAL, PEOPLE.length);
    play('whoosh');
    setDividers(next);
    setAnnouncement(
      `Divided equally: ${describe(sharesFromDividers(TOTAL, next))}`,
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby="slice-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:gap-14 group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div className="max-w-md shrink-0 group-data-[mode=track]/shell:w-[20rem]">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            Custom amounts
          </p>
          <h2
            id="slice-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            Slice the bill.
          </h2>
          <p className="mt-5 text-base text-muted">
            Not everyone ate the same. Drag the dividers to give each person
            their part; the total always has to match.
          </p>
        </div>

        <div className="w-full rounded-3xl border border-border bg-[#0a0a0a] p-5 sm:p-7 group-data-[mode=track]/shell:w-[min(46rem,58vw)]">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              {DEMO_EXPENSE.name}
            </p>
            <span className="font-mono text-[15px] tabular-nums">
              {formatPeso(TOTAL)}
            </span>
          </div>

          <div className="relative mt-12 sm:mt-14">
            <HandNote
              direction="down-left"
              className="absolute -top-12 right-[8%] sm:-top-14 [&>span]:text-xl"
            >
              drag to slice
            </HandNote>
            <div
              ref={barRef}
              className="relative h-20 select-none rounded-2xl border border-white/10 sm:h-24"
            >
              <div
                aria-hidden
                className="absolute inset-0 flex overflow-hidden rounded-2xl"
              >
                {PEOPLE.map((person, i) => {
                  const share = shown[i] ?? 0;
                  const roomy = TOTAL > 0 && share / TOTAL >= 0.16;
                  const color = colorAt(i);
                  return (
                    <div
                      key={person.userId}
                      style={{
                        width: `${TOTAL > 0 ? (share / TOTAL) * 100 : 0}%`,
                        backgroundColor: color.fill,
                        color: color.text,
                      }}
                      className="flex min-w-0 flex-col items-center justify-center overflow-hidden px-2 text-center"
                    >
                      <span
                        className={
                          roomy
                            ? 'truncate text-[12px] font-semibold transition-opacity'
                            : 'opacity-0'
                        }
                      >
                        {person.name}
                      </span>
                      <PesoFlow
                        value={shares[i] ?? 0}
                        className={
                          roomy
                            ? 'text-[13px] font-semibold transition-opacity sm:text-[15px]'
                            : 'opacity-0'
                        }
                      />
                    </div>
                  );
                })}
              </div>

              {dividers.map((value, i) => (
                <DividerHandle
                  key={i}
                  index={i}
                  value={value}
                  dividers={dividers}
                  width={width}
                  leftName={PEOPLE[i]?.name ?? ''}
                  rightName={PEOPLE[i + 1]?.name ?? ''}
                  leftShare={shares[i] ?? 0}
                  rightShare={shares[i + 1] ?? 0}
                  reduced={reduced}
                  onMove={handleMove}
                  onRelease={() => setAnnouncement(describe(shares))}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 grid items-center gap-6 sm:grid-cols-[10rem_1fr]">
            <div className="mx-auto h-40 w-40">
              <Pizza shares={shown} />
            </div>

            <div>
              <ul className="space-y-1.5">
                {PEOPLE.map((person, i) => (
                  <li
                    key={person.userId}
                    className="flex h-9 items-center justify-between gap-3 rounded-xl border border-border px-3 text-[13px]"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: colorAt(i).fill }}
                      />
                      {person.name}
                    </span>
                    <PesoFlow value={shares[i] ?? 0} />
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p
                  className={
                    check.isValid
                      ? 'font-mono text-[12px] tabular-nums text-muted'
                      : 'font-mono text-[12px] tabular-nums text-[#ff6b6b]'
                  }
                >
                  Total assigned: {formatPeso(check.assigned)} /{' '}
                  {formatPeso(TOTAL)}
                  {!check.isValid && ' — amounts must match'}
                </p>
                <button
                  type="button"
                  onClick={divideEqually}
                  className="h-9 rounded-full border border-border bg-[#141414] px-4 text-[13px] font-medium tracking-[-0.02em] shadow-[0_3px_0_0_#000] outline-none transition-[transform,box-shadow] duration-75 hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent active:translate-y-[2px] active:shadow-[0_1px_0_0_#000]"
                >
                  Divide Equally
                </button>
              </div>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </div>
      </section>
    </MotionConfig>
  );
}
