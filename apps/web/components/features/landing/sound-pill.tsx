'use client';

import { Volume2, VolumeX } from 'lucide-react';

import { cn } from '@web/lib/utils';

import { useLandingSound } from './sound-provider';

/** Nav pill that mutes and unmutes the landing sound kit. */
export function SoundPill({ className }: { className?: string }) {
  const { muted, toggleMuted } = useLandingSound();

  return (
    <button
      type="button"
      aria-pressed={!muted}
      aria-label="Sound"
      title={muted ? 'Sound off' : 'Sound on'}
      onClick={toggleMuted}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-2.5 text-[13px] font-medium tracking-[-0.02em] text-muted transition hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.98] sm:px-3',
        className,
      )}
    >
      {muted ? (
        <VolumeX aria-hidden className="h-4 w-4" />
      ) : (
        <Volume2 aria-hidden className="h-4 w-4 text-accent" />
      )}
      <span className="hidden sm:inline">Sound</span>
    </button>
  );
}
