'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createAudioContext,
  playSound,
  randomPitch,
  type SoundName,
} from '@web/lib/landing/sound';

export const SOUND_STORAGE_KEY = 'moneyapp-landing-sound';

type LandingSound = {
  play: (name: SoundName) => void;
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
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readMuted();
    mutedRef.current = stored;
    setMuted(stored);
  }, []);

  useEffect(
    () => () => {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(noop);
    },
    [],
  );

  const unlock = useCallback(() => {
    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = createAudioContext();
      if (!ctx) return;
      ctxRef.current = ctx;
    }
    if (ctx.state === 'running') setReady(true);
    else if (ctx.state === 'suspended') {
      void ctx.resume().then(() => setReady(true), noop);
    }
  }, []);

  const emit = useCallback((name: SoundName) => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state === 'closed') return;
    // Sounds scheduled on a suspended context play as soon as it resumes.
    if (ctx.state === 'suspended') void ctx.resume().catch(noop);
    playSound(ctx, name, randomPitch());
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!mutedRef.current) emit(name);
    },
    [emit],
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
      {/* `contents` keeps layout untouched while catching the first gesture. */}
      <div className="contents" onPointerDownCapture={unlock}>
        {children}
      </div>
    </LandingSoundContext.Provider>
  );
}

/** Landing sound controls. Outside a SoundProvider every call is a no-op. */
export function useLandingSound(): LandingSound {
  return useContext(LandingSoundContext);
}
