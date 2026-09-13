'use client';

import { useEffect, useRef, type PointerEvent } from 'react';
import createGlobe, { type Globe, type Marker } from 'cobe';

import {
  GLOBE_THETA,
  globeDevicePixelRatio,
  phiFacing,
  projectLocation,
  shortestTurn,
  type GlobePing,
} from '@web/lib/landing/globe';
import { DEMO_CITIES } from '@web/lib/landing/simulated';
import { cn } from '@web/lib/utils';

/** How long a ping's marker swells and its ₱ coin shows. */
export const GLOBE_PULSE_MS = 2000;

type GlobeCanvasProps = {
  ping: GlobePing | null;
  /** The render loop only runs while the globe is on screen. */
  active: boolean;
  reduced: boolean;
  className?: string;
};

const NEON: [number, number, number] = [0, 1, 0x41 / 255];
const MARKER_SIZE = 0.03;
const PING_SIZE = 0.1;
/** Idle spin, in radians per 60 fps frame. */
const AUTO_SPIN = 0.0025;
const MAX_SPIN = 0.2;
/** Per-frame decay of a fling back towards the idle spin. */
const INERTIA = 0.95;
/** A drag that rests this long before release doesn't fling. */
const FLING_WINDOW_MS = 80;
/** A focused city lands a little left of center; the spin carries it over. */
const FOCUS_LEAD = 0.25;
/** Keep drawing this long after the loop starts, while cobe's map loads. */
const WARM_UP_MS = 600;

function markersFor(pinged: string | null, swell: number): Marker[] {
  return DEMO_CITIES.map((city) => ({
    location: [city.lat, city.lng],
    size:
      city.name === pinged
        ? MARKER_SIZE + (PING_SIZE - MARKER_SIZE) * swell
        : MARKER_SIZE,
  }));
}

/**
 * The cobe globe behind "Splits around the world": neon markers on a dark
 * map, drag to spin with inertia, an idle spin, and a ₱ coin that pops over
 * each pinged city. Browser-only (WebGL, ESM-only cobe), so `DemoGlobe` loads
 * it with `next/dynamic` and `ssr: false`.
 *
 * cobe wraps its canvas in a div of its own and leaves it behind on
 * `destroy()`, so the canvas lives in a mount node React never renders into.
 */
export function GlobeCanvas({
  ping,
  active,
  reduced,
  className,
}: GlobeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLSpanElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const reducedRef = useRef(reduced);
  const spin = useRef({
    phi: phiFacing(122),
    velocity: 0,
    target: null as number | null,
    dragging: false,
    lastX: 0,
    lastMove: 0,
    size: 0,
    dirty: true,
    ping: null as GlobePing | null,
    pingStart: 0,
  });

  useEffect(() => {
    reducedRef.current = reduced;
    spin.current.dirty = true;
  }, [reduced]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    mount.append(canvas);
    const s = spin.current;
    s.size = Math.max(1, Math.round(mount.clientWidth));

    let globe: Globe | null = null;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: globeDevicePixelRatio(window.devicePixelRatio),
        width: s.size,
        height: s.size,
        phi: s.phi,
        theta: GLOBE_THETA,
        dark: 1,
        diffuse: 1.4,
        scale: 1,
        mapSamples: 16000,
        mapBrightness: 5,
        baseColor: [0.07, 0.11, 0.08],
        markerColor: NEON,
        glowColor: [0.05, 0.4, 0.14],
        markers: markersFor(null, 0),
      });
    } catch {
      // No WebGL: the caption and spin buttons still tell the story.
    }
    globeRef.current = globe;

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        const next = Math.round(mount.clientWidth);
        if (next <= 0 || next === s.size) return;
        s.size = next;
        globe?.update({ width: next, height: next });
        s.dirty = true;
      });
      observer.observe(mount);
    }

    return () => {
      observer?.disconnect();
      globe?.destroy();
      globeRef.current = null;
      mount.replaceChildren();
    };
  }, []);

  /** Renders one frame; returns whether the ping still needs frames. */
  const draw = (now: number) => {
    const s = spin.current;
    const still = reducedRef.current;
    const current = s.ping;
    const t = current ? (now - s.pingStart) / GLOBE_PULSE_MS : 1;
    const pulsing = current !== null && (still || t < 1);
    const swell = !pulsing
      ? 0
      : still
        ? 0.5
        : t < 0.2
          ? t / 0.2
          : (1 - t) / 0.8;

    globeRef.current?.update({
      phi: s.phi,
      markers: markersFor(pulsing && current ? current.city.name : null, swell),
    });

    const coin = coinRef.current;
    if (coin) {
      if (pulsing && current) {
        const point = projectLocation(
          current.city.lat,
          current.city.lng,
          s.phi,
          GLOBE_THETA,
        );
        const fade = still
          ? 1
          : t < 0.1
            ? t / 0.1
            : t > 0.8
              ? (1 - t) / 0.2
              : 1;
        coin.style.left = `${point.x * 100}%`;
        coin.style.top = `${point.y * 100}%`;
        coin.style.opacity = point.visible ? String(fade) : '0';
      } else {
        coin.style.opacity = '0';
      }
    }
    return pulsing && !still;
  };

  // The render loop: off-screen it doesn't run at all.
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();
    const warmUntil = last + WARM_UP_MS;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / (1000 / 60), 4);
      last = now;
      const s = spin.current;

      if (!s.dragging) {
        if (s.target !== null) {
          const turn = shortestTurn(s.phi, s.target);
          if (Math.abs(turn) < 0.003) {
            s.phi = s.target;
            s.target = null;
          } else {
            s.phi += turn * Math.min(1, 0.07 * dt);
          }
          s.dirty = true;
        } else if (!reducedRef.current) {
          s.velocity = AUTO_SPIN + (s.velocity - AUTO_SPIN) * INERTIA ** dt;
          s.phi += s.velocity * dt;
          s.dirty = true;
        }
      }
      s.phi %= 2 * Math.PI;

      if (s.dirty || now < warmUntil) s.dirty = draw(now);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `draw` only reads refs, so it can stay out of the deps.
  }, [active]);

  useEffect(() => {
    if (!ping) return;
    const s = spin.current;
    s.ping = ping;
    s.pingStart = performance.now();
    s.dirty = true;
    if (s.dragging) return;

    const facing = phiFacing(ping.city.lng) - FOCUS_LEAD;
    if (reducedRef.current) {
      // No turning animation; a visitor's own expense jumps into view.
      if (ping.focus) {
        s.phi = facing;
        s.target = null;
      }
      return;
    }
    const { visible } = projectLocation(
      ping.city.lat,
      ping.city.lng,
      s.phi,
      GLOBE_THETA,
    );
    if (ping.focus || !visible) s.target = facing;
  }, [ping]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const s = spin.current;
    s.dragging = true;
    s.target = null;
    s.velocity = 0;
    s.lastX = event.clientX;
    s.lastMove = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = spin.current;
    if (!s.dragging) return;
    // Dragging across the whole globe turns it half way round.
    const step = ((event.clientX - s.lastX) / s.size) * Math.PI;
    s.lastX = event.clientX;
    s.lastMove = performance.now();
    s.phi += step;
    s.velocity = Math.min(Math.max(step, -MAX_SPIN), MAX_SPIN);
    s.dirty = true;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const s = spin.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (
      reducedRef.current ||
      performance.now() - s.lastMove > FLING_WINDOW_MS
    ) {
      s.velocity = 0;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      // touch-pan-y: a vertical swipe still scrolls the page on phones.
      className={cn(
        'relative aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing',
        className,
      )}
    >
      <div ref={mountRef} aria-hidden className="absolute inset-0" />
      <span
        ref={coinRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-[calc(100%+4px)] items-center justify-center rounded-full border border-[#0b5d20] bg-accent font-mono text-[12px] font-bold text-black opacity-0 shadow-[0_0_16px_rgb(0_255_65/0.8)]"
      >
        <span
          key={ping?.id ?? 0}
          className="absolute inset-0 rounded-full border border-accent motion-safe:animate-ping"
        />
        ₱
      </span>
    </div>
  );
}
