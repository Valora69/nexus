'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { motion, MotionConfig, type Transition } from 'motion/react';

import { HandNote } from './hand-note';
import { useLandingSound } from './sound-provider';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** Minimum gap between hover taps, so sweeping across cards stays a patter. */
export const BENTO_TAP_COOLDOWN_MS = 140;

type IllustrationProps = { playing: boolean };

type Feature = {
  title: string;
  copy: string;
  Illustration: (props: IllustrationProps) => JSX.Element;
};

const EASE = 'easeInOut' as const;
const REST: Transition = { duration: 0.25, ease: EASE };

/** A repeating transition while playing, a quick settle otherwise. */
function loop(playing: boolean, t: Transition = {}): Transition {
  return playing
    ? { duration: 1, ease: EASE, repeat: Infinity, repeatDelay: 0.5, ...t }
    : REST;
}

// Every illustration draws in currentColor on a 160×100 canvas; the card sets
// the color (dim at rest, neon when active).
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full overflow-visible"
    >
      {children}
    </svg>
  );
}

const ORIGIN_BOTTOM = { transformBox: 'fill-box', originY: 1 } as const;
const ORIGIN_TOP = { transformBox: 'fill-box', originY: 0 } as const;

function GroupsArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <rect
        x={16}
        y={14}
        width={128}
        height={76}
        rx={18}
        strokeDasharray="3 6"
      />
      {[48, 80, 112].map((cx, i) => (
        <motion.g
          key={cx}
          animate={{ y: playing ? [0, -7, 0] : 0 }}
          transition={loop(playing, { duration: 0.7, delay: i * 0.12 })}
        >
          <circle cx={cx} cy={42} r={9} />
          <path d={`M${cx - 15} 76 a15 15 0 0 1 30 0`} />
        </motion.g>
      ))}
    </Svg>
  );
}

function QuickCaptureArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <rect x={52} y={26} width={56} height={58} rx={12} />
      <motion.g
        animate={{ y: playing ? [0, 6, 0] : 0 }}
        transition={loop(playing, { duration: 0.35, repeatDelay: 1 })}
      >
        <rect x={52} y={16} width={56} height={52} rx={12} />
        <text
          x={80}
          y={50}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize={26}
          fontWeight={800}
        >
          Q
        </text>
      </motion.g>
      <motion.text
        x={126}
        y={30}
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize={11}
        fontWeight={700}
        animate={
          playing
            ? { opacity: [0, 1, 0], y: [6, -4, -10] }
            : { opacity: 0, y: 6 }
        }
        transition={loop(playing, { duration: 1, repeatDelay: 0.35 })}
      >
        +₱390
      </motion.text>
    </Svg>
  );
}

function DivideArt({ playing }: IllustrationProps) {
  // Dividers glide from an equal three-way split to custom shares and back.
  const dividers = [
    { equal: 58.7, custom: 44 },
    { equal: 101.3, custom: 118 },
  ];
  return (
    <Svg>
      <rect x={16} y={36} width={128} height={28} rx={8} />
      {dividers.map((d) => (
        <motion.g
          key={d.equal}
          initial={false}
          animate={{
            x: playing ? [d.equal, d.custom, d.custom, d.equal] : d.equal,
          }}
          transition={loop(playing, {
            duration: 2,
            times: [0, 0.35, 0.65, 1],
            repeatDelay: 0.2,
          })}
        >
          <line x1={0} x2={0} y1={30} y2={70} />
          <circle cx={0} cy={80} r={3} fill="currentColor" stroke="none" />
        </motion.g>
      ))}
    </Svg>
  );
}

function ProofArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <text
        x={22}
        y={26}
        fill="currentColor"
        stroke="none"
        fontSize={10}
        fontWeight={700}
      >
        GCash
      </text>
      <text
        x={138}
        y={26}
        textAnchor="end"
        fill="currentColor"
        stroke="none"
        fontSize={10}
        fontWeight={700}
      >
        Cash
      </text>
      <motion.g
        animate={
          playing
            ? { y: [-26, 0, 0], opacity: [0, 1, 0] }
            : { y: 0, opacity: 1 }
        }
        transition={loop(playing, { duration: 1.1, times: [0, 0.45, 1] })}
      >
        <circle cx={80} cy={38} r={12} />
        <text
          x={80}
          y={43}
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize={14}
          fontWeight={800}
        >
          ₱
        </text>
      </motion.g>
      <path d="M44 58 H116" />
      <rect x={52} y={58} width={56} height={32} rx={4} />
      <motion.path
        d="M70 74 l7 7 l14 -14"
        initial={false}
        animate={{ pathLength: playing ? [0, 0, 1] : 1 }}
        transition={loop(playing, { duration: 1.1, times: [0, 0.45, 0.8] })}
      />
    </Svg>
  );
}

function VerifyArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <circle cx={36} cy={40} r={14} />
      <circle cx={124} cy={40} r={14} />
      <path d="M56 40 H104" strokeDasharray="3 5" />
      <path d="M98 34 l6 6 l-6 6" />
      {[
        { d: 'M26 74 l7 7 l13 -13', times: [0, 0.25, 0.85, 1] },
        { d: 'M114 74 l7 7 l13 -13', times: [0, 0.5, 0.85, 1] },
      ].map((check, i) => (
        <motion.path
          key={check.d}
          d={check.d}
          initial={false}
          animate={{ pathLength: playing ? [0, i === 0 ? 1 : 0, 1, 0] : 1 }}
          transition={loop(playing, {
            duration: 1.8,
            times: i === 0 ? [0, 0.25, 0.85, 1] : [0, 0.35, 0.55, 1],
            repeatDelay: 0.2,
          })}
        />
      ))}
    </Svg>
  );
}

function BellArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <motion.g
        style={ORIGIN_TOP}
        animate={{ rotate: playing ? [0, 16, -14, 10, -6, 0] : 0 }}
        transition={loop(playing, { duration: 0.8, repeatDelay: 0.7 })}
      >
        <path d="M80 14 v6" />
        <path d="M62 70 V48 a18 18 0 0 1 36 0 V70 l6 6 H56 z" />
        <path d="M74 82 a6 6 0 0 0 12 0" />
      </motion.g>
      <motion.circle
        cx={100}
        cy={30}
        r={6}
        fill="currentColor"
        stroke="none"
        initial={false}
        animate={{ scale: playing ? [0, 1.25, 1] : 1 }}
        transition={loop(playing, { duration: 0.5, repeatDelay: 1 })}
      />
    </Svg>
  );
}

function DashboardArt({ playing }: IllustrationProps) {
  const bars = [30, 50, 24, 60, 42];
  return (
    <Svg>
      <path d="M22 86 H138" />
      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={32 + i * 22}
          y={84 - h}
          width={12}
          height={h}
          rx={3}
          style={ORIGIN_BOTTOM}
          initial={false}
          animate={{ scaleY: playing ? [1, 0.25, 1] : 1 }}
          transition={loop(playing, { duration: 1, delay: i * 0.08 })}
        />
      ))}
      <text
        x={138}
        y={18}
        textAnchor="end"
        fill="currentColor"
        stroke="none"
        fontSize={10}
        fontWeight={700}
      >
        SEP
      </text>
    </Svg>
  );
}

function OfflineArt({ playing }: IllustrationProps) {
  return (
    <Svg>
      <rect x={56} y={8} width={48} height={86} rx={10} />
      <path d="M73 15 H87" />
      {/* Wi-Fi with a slash: offline. */}
      <path d="M70 32 a14 14 0 0 1 20 0" />
      <path d="M74 36 a8 8 0 0 1 12 0" />
      <path d="M68 26 L92 40" />
      {[52, 64, 76].map((y, i) => (
        <motion.rect
          key={y}
          x={64}
          y={y}
          width={32}
          height={8}
          rx={2}
          initial={false}
          animate={
            playing
              ? { opacity: [0, 1, 1, 0], x: [8, 0, 0, 0] }
              : { opacity: 1, x: 0 }
          }
          transition={loop(playing, {
            duration: 2,
            times: [0, 0.2 + i * 0.12, 0.8, 1],
          })}
        />
      ))}
    </Svg>
  );
}

// Copy is limited to what README.md says the product does today.
const FEATURES: Feature[] = [
  {
    title: 'Groups',
    copy: 'Make a group, add members, and track everything spent inside it.',
    Illustration: GroupsArt,
  },
  {
    title: 'Quick Capture',
    copy: 'Press Q anywhere and type one line; it becomes a group expense.',
    Illustration: QuickCaptureArt,
  },
  {
    title: 'Divide equally or custom',
    copy: 'Split evenly between members, or set a custom amount for each.',
    Illustration: DivideArt,
  },
  {
    title: 'GCash or cash with proof',
    copy: 'Settle your share via GCash or cash and attach proof of payment.',
    Illustration: ProofArt,
  },
  {
    title: 'Two-sided verification',
    copy: 'The payee verifies each payment, so a claim alone never clears a debt.',
    Illustration: VerifyArt,
  },
  {
    title: 'Notifications',
    copy: 'An in-app inbox for expenses, payments, and friend requests.',
    Illustration: BellArt,
  },
  {
    title: 'Monthly dashboard',
    copy: "See what you owe and what you're owed, month by month.",
    Illustration: DashboardArt,
  },
  {
    title: 'Offline capture on iOS',
    copy: 'Queue expenses and payments offline; they sync once you reconnect.',
    Illustration: OfflineArt,
  },
];

type BentoCardProps = {
  feature: Feature;
  onActivate: () => void;
  reduced: boolean;
};

function BentoCard({ feature, onActivate, reduced }: BentoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const titleId = useId();
  const active = hovered || focused;
  const { Illustration } = feature;

  return (
    <article
      // Focusable so keyboard visitors get the same lit state (and so Tab
      // walks the track through the bento).
      tabIndex={0}
      aria-labelledby={titleId}
      data-active={active}
      onPointerEnter={() => {
        setHovered(true);
        onActivate();
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        onActivate();
      }}
      onBlur={() => setFocused(false)}
      className="group/card flex min-h-[15rem] flex-col rounded-3xl border border-border bg-[#0a0a0a] p-5 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black data-[active=true]:border-accent/40 group-data-[mode=track]/shell:min-h-0"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center py-2 text-white/25 transition-[color,filter] duration-300 group-data-[active=true]/card:text-accent group-data-[active=true]/card:drop-shadow-[0_0_6px_rgb(0_255_65/0.55)]">
        <div className="h-24 w-full max-w-[12rem]">
          <Illustration playing={active && !reduced} />
        </div>
      </div>
      <h3
        id={titleId}
        className="mt-3 font-[family-name:var(--font-display)] text-base font-bold tracking-[-0.02em]"
      >
        {feature.title}
      </h3>
      <p className="mt-1 text-[13px] leading-snug tracking-[-0.01em] text-muted">
        {feature.copy}
      </p>
    </article>
  );
}

/** "Everything your barkada needs.": eight real features, lit on hover. */
export function Bento() {
  const reduced = usePrefersReducedMotion();
  const { play } = useLandingSound();
  const lastTap = useRef(-Infinity);

  const handleActivate = useCallback(() => {
    const now = performance.now();
    if (now - lastTap.current < BENTO_TAP_COOLDOWN_MS) return;
    lastTap.current = now;
    play('tap');
  }, [play]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:gap-14 group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div className="max-w-md shrink-0 group-data-[mode=track]/shell:w-[22rem]">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            Everything your barkada needs.
          </h2>
          <p className="mt-5 text-base text-muted">
            Eight things MoneyApp does today, from the first expense to the last
            verified payment.
          </p>
          <HandNote
            direction="down-right"
            className="mt-6 hidden group-data-[mode=track]/shell:flex"
          >
            hover to light them up
          </HandNote>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 group-data-[mode=track]/shell:grid-cols-[repeat(4,16.5rem)] group-data-[mode=track]/shell:auto-rows-[clamp(13rem,calc((100dvh-12rem)/2),18rem)]">
          {FEATURES.map((feature) => (
            <BentoCard
              key={feature.title}
              feature={feature}
              onActivate={handleActivate}
              reduced={reduced}
            />
          ))}
        </div>
      </section>
    </MotionConfig>
  );
}
