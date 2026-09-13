'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';

import {
  SAMPLE_SOUNDS,
  createAudioContext,
  isSampleName,
  loadSample,
  playBuffer,
  playSound,
  randomPitch,
  type LandingSoundName,
  type SampleName,
} from '@web/lib/landing/sound';

export const SOUND_STORAGE_KEY = 'moneyapp-landing-sound';

/** A press's click event lands this soon after pointerup. */
const CLICK_GRACE_MS = 120;
/** Long enough for a click to finish after the page navigates away. */
const CLOSE_DELAY_MS = 400;

type LandingSound = {
  play: (name: LandingSoundName) => void;
  muted: boolean;
  toggleMuted: () => void;
  /** An AudioContext exists and is running (after the first click). */
  ready: boolean;
};

const noop = () => {};

const LandingSoundContext = createContext<LandingSound>({
  play: noop,
  muted: false,
  toggleMuted: noop,
  ready: false,
});

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === 'muted';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean) {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, muted ? 'muted' : 'on');
  } catch {
    // Private mode / blocked storage: the choice lasts for this visit only.
  }
}

/**
 * Owns the landing page's single AudioContext. Browsers only allow audio after
 * a user gesture, so the context is created on the first pointerdown inside
 * the wrapped landing root; from then on `play` is audible unless muted.
 * Every primary press anywhere on the page clicks, except on elements marked
 * `data-landing-no-click` (drag handles with their own sound).
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const samplesRef = useRef(new Map<SampleName, AudioBuffer>());
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readMuted();
    mutedRef.current = stored;
    setMuted(stored);
  }, []);

  // A click on Get Started navigates away mid-sound; let it ring out first.
  useEffect(
    () => () => {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx && ctx.state !== 'closed') {
        window.setTimeout(() => void ctx.close().catch(noop), CLOSE_DELAY_MS);
      }
    },
    [],
  );

  // Whether a pointer press is in progress, and when the last one ended.
  const pressingRef = useRef(false);
  const releasedAtRef = useRef(-Infinity);

  useEffect(() => {
    const release = () => {
      pressingRef.current = false;
      releasedAtRef.current = performance.now();
    };
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);
    return () => {
      window.removeEventListener('pointerup', release, true);
      window.removeEventListener('pointercancel', release, true);
    };
  }, []);

  const unlock = useCallback(() => {
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = createAudioContext();
      if (!ctx) return;
      ctxRef.current = ctx;
      const fresh = ctx;
      for (const [name, sample] of Object.entries(SAMPLE_SOUNDS)) {
        void loadSample(fresh, sample.url).then((buffer) => {
          if (buffer) samplesRef.current.set(name as SampleName, buffer);
        });
      }
    }
    if (ctx.state === 'running') setReady(true);
    else if (ctx.state === 'suspended') {
      void ctx.resume().then(() => setReady(true), noop);
    }
  }, []);

  const emit = useCallback((name: LandingSoundName) => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state === 'closed') return;
    // Sounds scheduled on a suspended context play as soon as it resumes.
    if (ctx.state === 'suspended') void ctx.resume().catch(noop);
    if (!isSampleName(name)) {
      playSound(ctx, name, randomPitch());
      return;
    }
    const buffer = samplesRef.current.get(name);
    if (buffer) playBuffer(ctx, buffer, randomPitch());
    else playSound(ctx, SAMPLE_SOUNDS[name].fallback, randomPitch());
  }, []);

  const play = useCallback(
    (name: LandingSoundName) => {
      if (mutedRef.current) return;
      // Every press already clicks on pointerdown; a toy's own tap for that
      // same press (fired on click) would double it. Keyboard taps still play.
      const pressed =
        pressingRef.current ||
        performance.now() - releasedAtRef.current < CLICK_GRACE_MS;
      if (name === 'tap' && pressed) return;
      emit(name);
    },
    [emit],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      unlock();
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      const quiet = target?.closest?.('[data-landing-no-click]');
      if (!quiet && !mutedRef.current) emit('tap');
      pressingRef.current = true;
    },
    [emit, unlock],
  );

  const toggleMuted = useCallback(() => {
    // Toggling is itself a gesture, so keyboard users can enable sound too.
    unlock();
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    writeMuted(next);
    if (!next) emit('tap');
  }, [emit, unlock]);

  const value = useMemo(
    () => ({ play, muted, toggleMuted, ready }),
    [play, muted, toggleMuted, ready],
  );

  return (
    <LandingSoundContext.Provider value={value}>
      {/* `contents` keeps layout untouched while catching every press. */}
      <div className="contents" onPointerDownCapture={handlePointerDown}>
        {children}
      </div>
    </LandingSoundContext.Provider>
  );
}

/** Landing sound controls. Outside a SoundProvider every call is a no-op. */
export function useLandingSound(): LandingSound {
  return useContext(LandingSoundContext);
}
