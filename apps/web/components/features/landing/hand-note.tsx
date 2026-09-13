'use client';

import { motion } from 'motion/react';

import { cn } from '@web/lib/utils';

import { useInView } from './use-in-view';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export type HandNoteDirection =
  'up-left' | 'up-right' | 'down-left' | 'down-right';

type HandNoteProps = {
  children: React.ReactNode;
  direction?: HandNoteDirection;
  className?: string;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// The arrow is drawn pointing down-right and mirrored for other directions.
const FLIP: Record<HandNoteDirection, string> = {
  'down-right': '',
  'down-left': '-scale-x-100',
  'up-right': '-scale-y-100',
  'up-left': '-scale-x-100 -scale-y-100',
};

/** Handwritten Caveat note with an arrow that draws itself once in view. */
export function HandNote({
  children,
  direction = 'down-right',
  className,
}: HandNoteProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: true,
    threshold: 0.6,
  });
  const reduced = usePrefersReducedMotion();
  const drawn = inView || reduced;
  const isUp = direction.startsWith('up');
  const isLeft = direction.endsWith('left');

  const draw = (delay: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: drawn
      ? { pathLength: 1, opacity: 1 }
      : { pathLength: 0, opacity: 0 },
    transition: reduced
      ? { duration: 0 }
      : { duration: 0.6, delay, ease: EASE_OUT },
  });

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none flex w-max select-none gap-1 text-accent/70',
        isUp ? 'flex-col-reverse' : 'flex-col',
        isLeft ? 'items-start' : 'items-end',
        className,
      )}
    >
      <span className="font-[family-name:var(--font-hand)] text-2xl font-semibold leading-none">
        {children}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('h-10 w-10', FLIP[direction])}
      >
        <motion.path d="M8 6 C 10 18, 20 32, 40 38" {...draw(0)} />
        <motion.path d="M29 40 L40 38 L35 28" {...draw(0.45)} />
      </svg>
    </div>
  );
}
