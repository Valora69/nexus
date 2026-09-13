'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import type Lenis from 'lenis';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'motion/react';

import { cn } from '@web/lib/utils';

import { Panel, type PanelWidth } from './panel';

// Lenis is ESM-only and browser-only: load it on demand, in track mode only.
const SmoothScroll = dynamic(
  () => import('./smooth-scroll').then((m) => m.SmoothScroll),
  { ssr: false },
);

export type LandingPanel = {
  key: string;
  /** Rail label, and the panel's data-landing-panel value. */
  label: string;
  width?: PanelWidth;
  padded?: boolean;
  content: ReactNode;
};

type LandingShellProps = {
  header?: ReactNode;
  panels: LandingPanel[];
  /** Vertical content after the track (footer, not-yet-ported sections). */
  children?: ReactNode;
};

export const TRACK_MEDIA_QUERY =
  '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** Horizontal margin kept around a focused element brought into view. */
const FOCUS_MARGIN = 96;

function useTrackMode(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia(TRACK_MEDIA_QUERY);
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return enabled;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * The landing page layout. At lg+ with a fine pointer and motion allowed, the
 * panels ride a sideways track: a tall container converts vertical (Lenis
 * smoothed) scroll into translateX of a sticky, viewport-high stage. Anywhere
 * else they simply stack. Both modes render the same tree, so switching never
 * remounts panel content.
 */
export function LandingShell({ header, panels, children }: LandingShellProps) {
  const track = useTrackMode();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const distanceMV = useMotionValue(0);
  const topMV = useMotionValue(0);
  // Page scroll against our own measurements. useScroll({ target }) caches
  // the container's offsets before its tall height is applied and can stick
  // at full progress, which parked the track on its last panel at load.
  const { scrollY } = useScroll();
  const travelled = useTransform(() =>
    clamp(scrollY.get() - topMV.get(), 0, distanceMV.get()),
  );
  const x = useTransform(() => -travelled.get());
  const progress = useTransform(() => {
    const d = distanceMV.get();
    return d > 0 ? travelled.get() / d : 0;
  });

  // Measure how far the track travels; re-measure whenever it or the stage
  // changes size (fonts, images, window resizes).
  useEffect(() => {
    const trackEl = trackRef.current;
    const stageEl = stageRef.current;
    if (!track || !trackEl || !stageEl) {
      distanceMV.set(0);
      setDistance(0);
      return;
    }

    const measure = () => {
      const next = Math.max(0, trackEl.scrollWidth - stageEl.clientWidth);
      const container = containerRef.current;
      if (container) {
        topMV.set(container.getBoundingClientRect().top + window.scrollY);
      }
      distanceMV.set(next);
      setDistance(next);
    };
    measure();

    window.addEventListener('resize', measure);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(trackEl);
      observer.observe(stageEl);
    }
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [track, distanceMV]);

  useMotionValueEvent(x, 'change', (latest) => {
    const stageEl = stageRef.current;
    if (!track || !stageEl) return;
    const center = -latest + stageEl.clientWidth / 2;
    let next = 0;
    panelRefs.current.forEach((el, i) => {
      if (el && el.offsetLeft <= center) next = i;
    });
    setActive((prev) => (prev === next ? prev : next));
  });

  /** Scroll the page so the track shows track-space x at the left edge. */
  const scrollToTrackX = useCallback(
    (trackX: number, immediate = false) => {
      const container = containerRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top + window.scrollY;
      const target = top + clamp(trackX, 0, distanceMV.get());
      if (lenis) {
        lenis.scrollTo(target, { immediate, duration: immediate ? 0 : 1.1 });
      } else {
        window.scrollTo({ top: target });
      }
    },
    [lenis, distanceMV],
  );

  const scrollToPanel = useCallback(
    (index: number, immediate = false) => {
      const el = panelRefs.current[index];
      if (el) scrollToTrackX(el.offsetLeft, immediate);
    },
    [scrollToTrackX],
  );

  // In track mode, in-page links (#features, #how-it-works, …) point at
  // elements inside panels whose vertical position means nothing; send them
  // to their panel instead.
  useEffect(() => {
    const trackEl = trackRef.current;
    if (!track || !trackEl) return;

    const panelIndexForHash = (hash: string) => {
      if (hash.length < 2) return -1;
      let el: HTMLElement | null = null;
      try {
        el = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        return -1;
      }
      if (!el || !trackEl.contains(el)) return -1;
      return panelRefs.current.findIndex((p) => p?.contains(el));
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      const href = anchor?.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const index = panelIndexForHash(href);
      if (index < 0) return;
      event.preventDefault();
      window.history.pushState(null, '', href);
      scrollToPanel(index);
    };

    const onHashChange = () => {
      const index = panelIndexForHash(window.location.hash);
      if (index >= 0) scrollToPanel(index);
    };

    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [track, scrollToPanel]);

  // A deep link (/#features) lands on its panel once the track is measured.
  const initialHashHandled = useRef(false);
  useEffect(() => {
    if (!track || distance === 0 || initialHashHandled.current) return;
    initialHashHandled.current = true;
    const hash = window.location.hash;
    if (hash.length < 2) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    const index = panelRefs.current.findIndex((p) => el && p?.contains(el));
    if (index >= 0) scrollToPanel(index, true);
  }, [track, distance, scrollToPanel]);

  // Keyboard focus moving into an off-screen part of the track scrolls it in.
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const stageEl = stageRef.current;
    const trackEl = trackRef.current;
    if (!track || !stageEl || !trackEl) return;
    // Browsers scroll overflow-hidden boxes to reveal focus; undo that.
    stageEl.scrollLeft = 0;

    const target = event.target as HTMLElement;
    const panel = panelRefs.current.find((p) => p?.contains(target));
    if (!panel) return;

    const trackLeft = trackEl.getBoundingClientRect().left;
    const rect = target.getBoundingClientRect();
    const elLeft = rect.left - trackLeft;
    const elRight = rect.right - trackLeft;
    const viewLeft = -x.get();
    const viewWidth = stageEl.clientWidth;
    if (elLeft >= viewLeft && elRight <= viewLeft + viewWidth) return;

    if (panel.offsetWidth <= viewWidth) {
      scrollToTrackX(panel.offsetLeft);
    } else {
      scrollToTrackX(
        clamp(
          elLeft - FOCUS_MARGIN,
          panel.offsetLeft,
          panel.offsetLeft + panel.offsetWidth - viewWidth,
        ),
      );
    }
  };

  return (
    <div data-mode={track ? 'track' : 'vertical'} className="group/shell">
      {header && (
        <div
          className={cn(
            track && 'pointer-events-none fixed inset-x-0 top-0 z-40',
          )}
        >
          <div className={cn(track && 'pointer-events-auto')}>{header}</div>
        </div>
      )}

      <main
        ref={containerRef}
        className="relative z-10 w-full"
        style={track ? { height: `calc(${distance}px + 100dvh)` } : undefined}
      >
        <div
          ref={stageRef}
          onScroll={(e) => {
            if (track) e.currentTarget.scrollLeft = 0;
          }}
          className={cn(track && 'sticky top-0 h-[100dvh] overflow-hidden')}
        >
          <motion.div
            ref={trackRef}
            onFocus={handleFocus}
            style={track ? { x } : undefined}
            className={cn('relative', track && 'flex h-full w-max')}
          >
            {panels.map((panel, i) => (
              <div
                key={panel.key}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                className={cn(track && 'h-full shrink-0')}
              >
                <Panel
                  label={panel.label}
                  width={panel.width}
                  padded={panel.padded}
                >
                  {panel.content}
                </Panel>
              </div>
            ))}
          </motion.div>

          {track && (
            <ProgressRail
              panels={panels}
              active={active}
              progress={progress}
              onSelect={(i) => scrollToPanel(i)}
            />
          )}
        </div>
      </main>

      {track && <SmoothScroll onReady={setLenis} />}

      {children}
    </div>
  );
}

type ProgressRailProps = {
  panels: LandingPanel[];
  active: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  onSelect: (index: number) => void;
};

function ProgressRail({
  panels,
  active,
  progress,
  onSelect,
}: ProgressRailProps) {
  return (
    <nav
      aria-label="Page sections"
      className="absolute inset-x-0 bottom-6 z-30 flex justify-center"
    >
      <div className="relative flex items-center gap-1 rounded-full border border-border bg-black/70 px-2 py-1.5 backdrop-blur-xl">
        <motion.span
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-4 bottom-0 h-px origin-left bg-accent/70"
        />
        {panels.map((panel, i) => {
          const current = i === active;
          return (
            <button
              key={panel.key}
              type="button"
              aria-current={current ? 'step' : undefined}
              onClick={() => onSelect(i)}
              className="group/dot flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[12px] font-medium tracking-[-0.02em] text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent aria-[current=step]:text-foreground"
            >
              <span
                aria-hidden
                className={cn(
                  'h-2 w-2 rounded-full border transition-all duration-300',
                  current
                    ? 'scale-125 border-accent bg-accent shadow-[0_0_10px_rgb(0_255_65/0.7)]'
                    : 'border-white/40 bg-transparent group-hover/dot:border-accent',
                )}
              />
              {panel.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
