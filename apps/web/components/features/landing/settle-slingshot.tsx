'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
  type PanInfo,
} from 'motion/react';
import { BadgeCheck, Send } from 'lucide-react';

import {
  DEMO_EXPENSE,
  DEMO_MEMBERS,
  demoSplitStatus,
  equalShares,
  formatPeso,
  pullAmount,
  type DemoSettleStage,
} from '@web/lib/landing/demo';
import { cn } from '@web/lib/utils';
import type { SplitStatus } from '@web/lib/utils/splits';

import { useDemoActivity } from './demo-activity-provider';
import { HandNote } from './hand-note';
import { NotificationToast } from './notification-toast';
import { useLandingSound } from './sound-provider';
import { useInView } from './use-in-view';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** How long the note flies from release to landing on Ced. */
export const SETTLE_FLIGHT_MS = 850;
export const SETTLE_TOAST_MS = 3200;
export const SETTLE_CONFETTI_MS = 1100;
/** Raw pointer travel (px) that charges the full share. */
export const SETTLE_MAX_PULL = 160;
/** Releases charged below this spring back instead of launching. */
export const SETTLE_MIN_AMOUNT = 50;

const DEBTOR_ID = 'ced';
const DEBTOR =
  DEMO_MEMBERS.find((m) => m.userId === DEBTOR_ID) ?? DEMO_MEMBERS[0]!;
const SHARE =
  equalShares(DEMO_EXPENSE.total, DEMO_EXPENSE.participantIds.length)[
    DEMO_EXPENSE.participantIds.indexOf(DEBTOR.userId)
  ] ?? 0;

const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** The note follows 35% of the pointer, so pulling feels like a rubber band. */
const PULL_ELASTIC = 0.35;
const FLIGHT_SAMPLES = 24;

type Point = { x: number; y: number };
type Geometry = { from: Point; to: Point };
type Pull = { amount: number; offset: Point };
type Toast = { id: number; title: string; amount: number; paid: boolean };
type Coin = { id: number; x: number; y: number; rotate: number };

const STATUS_LABEL: Record<SplitStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  pending: 'Pending',
  paid: 'Paid',
};

const STATUS_CLASS: Record<SplitStatus, string> = {
  unpaid: 'border-border text-muted',
  partial: 'border-[#ffb020]/50 bg-[#ffb020]/10 text-[#ffb020]',
  pending: 'border-[#ffb020]/50 bg-[#ffb020]/10 text-[#ffb020]',
  paid: 'border-accent/50 bg-accent/10 text-accent shadow-[0_0_12px_rgb(0_255_65/0.35)]',
};

/** ₱400 rather than ₱400.00, for the charge label. */
const formatPesoShort = (amount: number) =>
  formatPeso(amount).replace(/\.00$/, '');

/** A quadratic arc from the note (at `start`, relative to home) to Ced. */
function arc(start: Point, geo: Geometry) {
  const end = { x: geo.to.x - geo.from.x, y: geo.to.y - geo.from.y };
  const lift = Math.min(Math.max(Math.abs(end.x - start.x) * 0.35, 60), 150);
  const control = {
    x: (start.x + end.x) / 2,
    y: Math.min(start.y, end.y) - lift,
  };
  const at = (t: number): Point => ({
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
  });
  const angleAt = (t: number) => {
    const dx =
      2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x);
    const dy =
      2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  return { start, control, end, at, angleAt };
}

/** SVG path for the first `fraction` of the arc, in scene coordinates. */
function partialArcPath(start: Point, geo: Geometry, fraction: number) {
  const { control, at } = arc(start, geo);
  const c = Math.min(Math.max(fraction, 0), 1);
  // De Casteljau: the first part of a quadratic is itself a quadratic.
  const q = {
    x: start.x + (control.x - start.x) * c,
    y: start.y + (control.y - start.y) * c,
  };
  const e = at(c);
  const o = geo.from;
  return `M${o.x + start.x} ${o.y + start.y} Q${o.x + q.x} ${o.y + q.y} ${o.x + e.x} ${o.y + e.y}`;
}

function PaperPlaneNote() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 72 44"
      className="h-11 w-[72px] drop-shadow-[0_8px_10px_rgb(0_0_0/0.7)]"
    >
      {/* Upper wing, lower wing and the fold between them. */}
      <path
        d="M2 22 L70 3 L28 26 Z"
        fill="#d7f5d9"
        stroke="#0b5d20"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M28 26 L70 3 L38 41 Z"
        fill="#9fdca6"
        stroke="#0b5d20"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M28 26 L70 3" stroke="#0b5d20" strokeWidth={1} opacity={0.6} />
      <text
        x={30}
        y={19}
        fontSize={11}
        fontWeight={800}
        fill="#0b5d20"
        transform="rotate(-15 30 19)"
      >
        ₱
      </text>
    </svg>
  );
}

/**
 * "Settle with a flick.": pull a ₱ note folded into a paper plane back like a
 * slingshot and let go. It flies to Ced, whose share turns Pending until you
 * (the person who paid) verify it. A GCash button runs the same flight for
 * keyboard and screen-reader visitors.
 */
export function SettleSlingshot() {
  const { play } = useLandingSound();
  const { paymentSent } = useDemoActivity();
  const reduced = usePrefersReducedMotion();
  const { ref: sectionRef, inView } = useInView<HTMLElement>();

  const [stage, setStage] = useState<DemoSettleStage>('unpaid');
  const [sent, setSent] = useState(SHARE);
  const [flying, setFlying] = useState(false);
  const [pull, setPull] = useState<Pull | null>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [bump, setBump] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const sceneRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);

  const nextId = useRef(0);
  const timers = useRef(new Set<number>());
  const flights = useRef<AnimationPlaybackControls[]>([]);
  const flightAmount = useRef<number | null>(null);
  const lastOffset = useRef<Point>({ x: 0, y: 0 });
  const pullAmountRef = useRef(0);
  const lastTick = useRef(0);

  const later = (ms: number, run: () => void) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  };

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current.clear();
  };

  const stopFlight = () => {
    flights.current.forEach((c) => c.stop());
    flights.current = [];
  };

  useEffect(
    () => () => {
      clearTimers();
      stopFlight();
    },
    [],
  );

  // Where the note sits and where Ced's avatar is, in scene pixels.
  useEffect(() => {
    const scene = sceneRef.current;
    const home = homeRef.current;
    const avatar = avatarRef.current;
    if (!scene || !home || !avatar) return;
    const measure = () => {
      const s = scene.getBoundingClientRect();
      const h = home.getBoundingClientRect();
      const a = avatar.getBoundingClientRect();
      if (s.width === 0) return;
      setGeo({
        from: {
          x: h.left - s.left + h.width / 2,
          y: h.top - s.top + h.height / 2,
        },
        to: {
          x: a.left - s.left + a.width / 2,
          y: a.top - s.top + a.height / 2,
        },
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  const status: SplitStatus =
    stage === 'unpaid' ? 'unpaid' : demoSplitStatus(stage, SHARE, sent);
  const statusLabel = STATUS_LABEL[status];

  const land = useCallback(
    (amount: number, quiet: boolean) => {
      flightAmount.current = null;
      flights.current = [];
      const landed = demoSplitStatus('pending', SHARE, amount);
      setFlying(false);
      setStage('pending');
      setSent(amount);
      setAnnouncement(
        `Payment sent: ${formatPeso(amount)} from ${DEBTOR.name} via GCash. Status: ${STATUS_LABEL[landed]}, waiting for you to verify.`,
      );
      paymentSent(amount);
      if (quiet) return;
      play('thud');
      later(110, () => play('coin'));
      setBump((b) => b + 1);
      nextId.current += 1;
      const id = nextId.current;
      setToast({ id, title: 'Payment Sent', amount, paid: false });
      later(SETTLE_TOAST_MS, () =>
        setToast((prev) => (prev?.id === id ? null : prev)),
      );
    },
    // `later` only touches refs, so it can stay out of the deps.
    [paymentSent, play],
  );

  const launch = (amount: number, start: Point) => {
    if (stage !== 'unpaid' || flying) return;
    setPull(null);
    setFlying(true);
    flightAmount.current = amount;
    setAnnouncement(`Sending ${formatPeso(amount)} to ${DEBTOR.name}…`);

    if (reduced) {
      land(amount, false);
      return;
    }

    play('whoosh');
    if (geo) flyAlong(arc(start, geo));
    later(SETTLE_FLIGHT_MS, () => land(amount, false));
  };

  const flyAlong = (path: ReturnType<typeof arc>) => {
    const xs: number[] = [];
    const ys: number[] = [];
    const angles: number[] = [];
    for (let i = 0; i <= FLIGHT_SAMPLES; i++) {
      const t = i / FLIGHT_SAMPLES;
      // Ease in and out along the arc: a slow launch, fast middle, soft landing.
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const p = path.at(eased);
      xs.push(p.x);
      ys.push(p.y);
      angles.push(path.angleAt(eased));
    }
    const transition = {
      duration: SETTLE_FLIGHT_MS / 1000,
      ease: 'linear',
    } as const;
    flights.current = [
      animate(x, xs, transition),
      animate(y, ys, transition),
      animate(rotate, angles, transition),
      animate(scale, [1, 1.15, 0.55], { duration: SETTLE_FLIGHT_MS / 1000 }),
    ];
  };

  const verify = () => {
    if (stage !== 'pending' || flying) return;
    const verified = demoSplitStatus('paid', SHARE, sent);
    const settled = verified === 'paid';
    play('register');
    setStage('paid');
    setAnnouncement(
      settled
        ? `Payment verified. Split confirmed: ${DEBTOR.name} paid ${formatPeso(sent)}. Status: Paid.`
        : `Payment verified: ${formatPeso(sent)}. ${DEBTOR.name} still owes ${formatPeso(SHARE - sent)}. Status: ${STATUS_LABEL[verified]}.`,
    );
    nextId.current += 1;
    const id = nextId.current;
    setToast({
      id,
      title: settled ? 'Split Confirmed' : 'Payment Verified',
      amount: sent,
      paid: settled,
    });
    later(SETTLE_TOAST_MS, () =>
      setToast((prev) => (prev?.id === id ? null : prev)),
    );
    if (settled && !reduced) {
      // Randomness lives in the handler, never in render.
      setCoins(
        Array.from({ length: 10 }, (_, i) => {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
          const distance = 50 + Math.random() * 50;
          return {
            id: id * 100 + i,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            rotate: (Math.random() - 0.5) * 360,
          };
        }),
      );
      later(SETTLE_CONFETTI_MS, () => setCoins([]));
    }
  };

  const reset = () => {
    if (stage === 'unpaid' || flying) return;
    clearTimers();
    stopFlight();
    play('tap');
    x.jump(0);
    y.jump(0);
    rotate.jump(0);
    scale.jump(1);
    setStage('unpaid');
    setSent(SHARE);
    setToast(null);
    setCoins([]);
    setAnnouncement(
      `Reset. ${DEBTOR.name} owes you ${formatPeso(SHARE)}. Status: Unpaid.`,
    );
  };

  // Off-screen: no timers or flights keep running. A note mid-air lands
  // quietly so the state stays consistent when the visitor comes back.
  useEffect(() => {
    if (inView) return;
    clearTimers();
    stopFlight();
    setToast(null);
    setCoins([]);
    setPull(null);
    const amount = flightAmount.current;
    if (amount !== null) land(amount, true);
  }, [inView, land]);

  const canPull = stage === 'unpaid' && !flying && geo !== null;

  // Charge and note position straight from the pan offset. Beyond a zero-size
  // constraint box motion places the note at offset × elastic.
  const readPull = (info: PanInfo): Pull => ({
    amount: pullAmount(-info.offset.x, SETTLE_MAX_PULL, SHARE),
    offset: {
      x: info.offset.x * PULL_ELASTIC,
      y: info.offset.y * PULL_ELASTIC,
    },
  });

  const handleDrag = (_: unknown, info: PanInfo) => {
    const next = readPull(info);
    // A soft tick every ₱100 of charge.
    if (
      next.amount !== pullAmountRef.current &&
      next.amount % 100 === 0 &&
      next.amount > 0
    ) {
      const now = performance.now();
      if (now - lastTick.current > 40) {
        lastTick.current = now;
        play('tap');
      }
    }
    pullAmountRef.current = next.amount;
    setPull(next);
  };

  // onDrag runs once per frame, so a quick flick can release before the last
  // move reaches it; the end event carries the final offset.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { amount, offset } = readPull(info);
    pullAmountRef.current = 0;
    if (amount < SETTLE_MIN_AMOUNT) {
      setPull(null);
      return; // drag constraints spring the note home.
    }
    launch(amount, offset);
  };

  const noteHidden = stage !== 'unpaid' && !flying;
  const charge = pull ? pull.amount / SHARE : 0;
  const subline =
    stage === 'unpaid'
      ? 'No payment yet'
      : stage === 'pending'
        ? `${formatPeso(sent)}${sent < SHARE ? ` of ${formatPeso(SHARE)}` : ''} via GCash · waiting for you`
        : status === 'paid'
          ? `${formatPeso(sent)} verified by you`
          : `${formatPeso(sent)} verified · ${formatPeso(SHARE - sent)} left`;

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={sectionRef}
        aria-labelledby="settle-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:gap-14 group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div className="max-w-md shrink-0 group-data-[mode=track]/shell:w-[20rem]">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            Settle up
          </p>
          <h2
            id="settle-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            Settle with a flick.
          </h2>
          <p className="mt-5 text-base text-muted">
            {DEBTOR.name} sends their share by GCash or cash with proof, and it
            shows up on the split right away.
          </p>
          <p className="mt-3 text-base text-foreground">
            Payments stay pending until the person who paid confirms.
          </p>
        </div>

        <div className="w-full rounded-3xl border border-border bg-[#0a0a0a] p-5 sm:p-7 group-data-[mode=track]/shell:w-[min(40rem,52vw)]">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[15px] font-semibold tracking-[-0.02em]">
              {DEMO_EXPENSE.name}
            </p>
            <span className="font-mono text-[13px] tabular-nums text-muted">
              Paid by You · {formatPeso(DEMO_EXPENSE.total)}
            </span>
          </div>

          <div
            ref={sceneRef}
            className="relative mt-6 h-[260px] select-none sm:h-[280px]"
          >
            {/* Dashed trajectory preview, growing with the pull. */}
            {geo && pull && pull.amount > 0 && (
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              >
                <path
                  d={partialArcPath(pull.offset, geo, charge)}
                  fill="none"
                  stroke="#00ff41"
                  strokeOpacity={0.35 + charge * 0.5}
                  strokeWidth={2}
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                />
                <circle
                  cx={geo.to.x}
                  cy={geo.to.y}
                  r={36}
                  fill="none"
                  stroke="#00ff41"
                  strokeOpacity={charge * 0.6}
                  strokeDasharray="3 6"
                />
              </svg>
            )}

            {/* Ced: avatar + the ledger row. */}
            <div className="absolute right-0 top-1/2 flex w-[11.5rem] -translate-y-1/2 flex-col items-center gap-3 sm:w-[14rem]">
              {/* The ref sits on the wrapper: the avatar remounts to bounce. */}
              <div ref={avatarRef} className="relative">
                <motion.div
                  key={bump}
                  initial={bump > 0 ? { scale: 1.2 } : false}
                  animate={{ scale: 1 }}
                  transition={SPRING}
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full border-2 bg-[#1c1c1c] font-[family-name:var(--font-display)] text-xl font-extrabold transition-colors',
                    status === 'paid'
                      ? 'border-accent text-accent'
                      : status === 'unpaid'
                        ? 'border-white/15 text-foreground'
                        : 'border-[#ffb020] text-[#ffb020]',
                  )}
                >
                  {DEBTOR.name.charAt(0)}
                </motion.div>
                {/* ₱ coin confetti on a confirmed split. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2"
                >
                  <AnimatePresence>
                    {coins.map((coin) => (
                      <motion.span
                        key={coin.id}
                        initial={{
                          x: -8,
                          y: -8,
                          scale: 0.4,
                          opacity: 1,
                          rotate: 0,
                        }}
                        animate={{
                          x: coin.x - 8,
                          y: [coin.y * 0.9 - 8, coin.y + 40],
                          scale: 1,
                          opacity: [1, 1, 0],
                          rotate: coin.rotate,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: SETTLE_CONFETTI_MS / 1000,
                          ease: EASE_OUT,
                        }}
                        className="absolute flex h-4 w-4 items-center justify-center rounded-full border border-[#0b5d20] bg-accent font-mono text-[9px] font-bold text-black"
                      >
                        ₱
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="w-full rounded-2xl border border-border bg-black px-3 py-2.5">
                <p className="text-[13px] font-medium">
                  {DEBTOR.name} owes you
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="font-mono text-[15px] font-semibold tabular-nums">
                    {formatPeso(SHARE)}
                  </p>
                  <span
                    data-status={status}
                    className={cn(
                      'rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
                      STATUS_CLASS[status],
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-muted">
                  {subline}
                </p>
              </div>
            </div>

            {/* The folded ₱ note, home on the left. */}
            <div
              ref={homeRef}
              className="absolute left-[16%] top-[58%] h-11 w-[72px] -translate-x-1/2 -translate-y-1/2 sm:left-[20%]"
            >
              <HandNote
                direction="down-right"
                className="absolute -left-2 bottom-full mb-1 sm:-left-10 [&>span]:text-xl"
              >
                pull back &amp; let go
              </HandNote>
              <motion.div
                aria-hidden
                drag={canPull}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                dragElastic={PULL_ELASTIC}
                dragMomentum={false}
                onDragStart={() => {
                  lastOffset.current = { x: 0, y: 0 };
                  setPull({ amount: 0, offset: { x: 0, y: 0 } });
                }}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ opacity: noteHidden ? 0 : 1 }}
                transition={{ duration: noteHidden ? 0.15 : 0.3 }}
                style={{ x, y, rotate, scale }}
                // drag writes an inline touch-action; !touch-none keeps a touch
                // pull from scrolling the page instead.
                className={cn(
                  '!touch-none absolute inset-0',
                  canPull
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'pointer-events-none',
                )}
              >
                <PaperPlaneNote />
              </motion.div>
              {pull && pull.amount > 0 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-accent/40 bg-black px-2 py-0.5 font-mono text-[12px] font-semibold tabular-nums text-accent"
                  style={{ opacity: 0.6 + charge * 0.4 }}
                >
                  {formatPesoShort(pull.amount)}
                </span>
              )}
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
            >
              <AnimatePresence initial={false}>
                {toast && (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                  >
                    <NotificationToast
                      icon={
                        toast.paid ? (
                          <BadgeCheck aria-hidden className="h-4 w-4" />
                        ) : (
                          <Send aria-hidden className="h-4 w-4" />
                        )
                      }
                      title={toast.title}
                      amount={toast.amount}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => launch(SHARE, { x: 0, y: 0 })}
              // aria-disabled, not disabled: the pressed button keeps keyboard
              // focus while the flight runs; the handlers ignore it meanwhile.
              aria-disabled={stage !== 'unpaid' || flying}
              className="h-10 rounded-full bg-accent px-4 text-[13px] font-semibold tracking-[-0.02em] text-black shadow-[0_3px_0_0_#00801f] outline-none transition-[transform,box-shadow,background-color] duration-75 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] aria-[disabled=false]:active:translate-y-[2px] aria-[disabled=false]:active:shadow-[0_1px_0_0_#00801f] aria-disabled:cursor-not-allowed aria-disabled:bg-white/10 aria-disabled:text-muted aria-disabled:shadow-none"
            >
              Send {formatPesoShort(SHARE)} via GCash
            </button>
            <button
              type="button"
              onClick={verify}
              // aria-disabled, not disabled: the pressed button keeps keyboard
              // focus while the flight runs; the handlers ignore it meanwhile.
              aria-disabled={stage !== 'pending' || flying}
              className="h-10 rounded-full border border-border bg-[#141414] px-4 text-[13px] font-medium tracking-[-0.02em] shadow-[0_3px_0_0_#000] outline-none transition-[transform,box-shadow,color] duration-75 hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent aria-[disabled=false]:active:translate-y-[2px] aria-[disabled=false]:active:shadow-[0_1px_0_0_#000] aria-disabled:cursor-not-allowed aria-disabled:text-muted aria-disabled:shadow-none aria-disabled:hover:border-border"
            >
              Verify payment
            </button>
            <button
              type="button"
              onClick={reset}
              // aria-disabled, not disabled: the pressed button keeps keyboard
              // focus while the flight runs; the handlers ignore it meanwhile.
              aria-disabled={stage === 'unpaid' || flying}
              className="h-10 rounded-full px-3 text-[13px] font-medium tracking-[-0.02em] text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:text-muted"
            >
              Reset
            </button>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            You paid for {DEMO_EXPENSE.name}, so you&apos;re the one who
            verifies.
          </p>

          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </div>
      </section>
    </MotionConfig>
  );
}
