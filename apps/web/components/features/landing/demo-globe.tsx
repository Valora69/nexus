'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { GlobeNudge, GlobePing } from '@web/lib/landing/globe';
import {
  DEMO_CITIES,
  createDemoRng,
  nextCity,
  type DemoCity,
  type Rng,
} from '@web/lib/landing/simulated';

import { useDemoActivityListener } from './demo-activity-provider';
import { useInView } from './use-in-view';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

/** A new simulated city this often while the globe is on screen. */
export const GLOBE_PING_MS = 2500;
/** With reduced motion the globe holds still and captions change slowly. */
export const GLOBE_PING_REDUCED_MS = 6000;

const MANILA: DemoCity =
  DEMO_CITIES.find((c) => c.name === 'Manila') ?? DEMO_CITIES[0];

// cobe needs WebGL and ships ESM only: load it in the browser, after
// hydration. The placeholder holds the globe's square.
const GlobeCanvas = dynamic(
  () => import('./globe-canvas').then((m) => m.GlobeCanvas),
  { ssr: false, loading: () => <div className="aspect-square w-full" /> },
);

const SPIN_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-[#141414] text-muted shadow-[0_3px_0_0_#000] outline-none transition-[transform,box-shadow,color] duration-75 hover:border-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent active:translate-y-[2px] active:shadow-[0_1px_0_0_#000]';

/**
 * "Splits around the world.": a neon globe with simulated pings, weighted to
 * the Philippines, and always labeled demo. Server-safe: the section, caption
 * and buttons render anywhere, and only the cobe canvas is client-only.
 */
export function DemoGlobe() {
  const reduced = usePrefersReducedMotion();
  const { ref: sectionRef, inView } = useInView<HTMLElement>();

  const [city, setCity] = useState<DemoCity>(MANILA);
  const [ping, setPing] = useState<GlobePing | null>(null);
  const [nudge, setNudge] = useState<GlobeNudge | null>(null);
  const [restart, setRestart] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const rng = useRef<Rng | null>(null);
  const cityRef = useRef<DemoCity>(MANILA);
  const nextId = useRef(0);

  const pingCity = useCallback((next: DemoCity, focus: boolean) => {
    nextId.current += 1;
    cityRef.current = next;
    setCity(next);
    setPing({ id: nextId.current, city: next, focus });
  }, []);

  // Simulated activity, only while the globe is on screen. `restart` starts
  // a fresh interval after the visitor's own ping.
  useEffect(() => {
    if (!inView) return;
    const timer = window.setInterval(
      () => {
        if (document.hidden) return;
        rng.current ??= createDemoRng();
        pingCity(nextCity(rng.current, cityRef.current), false);
      },
      reduced ? GLOBE_PING_REDUCED_MS : GLOBE_PING_MS,
    );
    return () => window.clearInterval(timer);
  }, [inView, reduced, restart, pingCity]);

  // The visitor's own expense shows up in Manila right away.
  useDemoActivityListener((event) => {
    if (event.type !== 'expenseAdded') return;
    pingCity(MANILA, true);
    setRestart((r) => r + 1);
    if (inView) {
      setAnnouncement(`Demo: your expense just showed up in ${MANILA.name}.`);
    }
  });

  const spinBy = (direction: -1 | 1) => {
    nextId.current += 1;
    setNudge({ id: nextId.current, direction });
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={sectionRef}
        aria-labelledby="globe-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:gap-14 group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div className="max-w-md shrink-0 group-data-[mode=track]/shell:w-[20rem]">
          <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            Around the world
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] leading-none tracking-[0.12em]">
              Demo
            </span>
          </p>
          <h2
            id="globe-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            Splits around the world.
          </h2>
          <p className="mt-5 text-base text-muted">
            Rent in Manila, milk tea in Cebu, hotpot in Tokyo. Drag the globe to
            spin it.
          </p>
          <p className="mt-3 text-[13px] text-muted">
            This globe is a demo: the pings are simulated on this page, not real
            activity.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[30rem] group-data-[mode=track]/shell:mx-0 group-data-[mode=track]/shell:w-[min(34rem,calc(100dvh-15rem))] group-data-[mode=track]/shell:max-w-none">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgb(0_255_65/0.16),transparent_70%)] blur-2xl"
          />
          <GlobeCanvas
            ping={ping}
            nudge={nudge}
            active={inView}
            reduced={reduced}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p
              data-globe-caption
              // Wraps rather than truncates: the city is the point on phones.
              className="min-w-0 font-mono text-[13px] text-muted"
            >
              <span className="text-accent">Demo</span> · Splits happening in{' '}
              {/* Enter-only: a new key mounts the next city, so the caption
                  never waits on an exit animation to finish. */}
              <motion.span
                key={ping?.id ?? 0}
                initial={ping ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-block text-foreground"
              >
                {city.name}
              </motion.span>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Spin the globe left"
                onClick={() => spinBy(-1)}
                className={SPIN_BUTTON}
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Spin the globe right"
                onClick={() => spinBy(1)}
                className={SPIN_BUTTON}
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </div>
      </section>
    </MotionConfig>
  );
}
