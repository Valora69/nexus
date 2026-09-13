'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Receipt } from 'lucide-react';

import { cn } from '@web/lib/utils';

import { NotificationToast } from './notification-toast';

export type HeroToast = { id: number; amount: number };

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * "New Expense Added" toasts fired by the coin key. The newest sits nearest
 * the key and older ones rise away. Hidden from assistive tech: the hero
 * announces each expense through its own aria-live region.
 */
export function HeroToasts({
  toasts,
  className,
}: {
  toasts: HeroToast[];
  className?: string;
}) {
  return (
    // Fixed height for three toasts, bottom-anchored: the box never moves, and
    // dismissing the oldest (top) toast leaves the others in place, so
    // auto-dismissal causes no layout shift.
    <div
      aria-hidden
      className={cn(
        'pointer-events-none flex h-[190px] w-[240px] flex-col items-end justify-end gap-2',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <NotificationToast
              icon={<Receipt aria-hidden className="h-4 w-4" />}
              title="New Expense Added"
              amount={toast.amount}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
