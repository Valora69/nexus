'use client';

import { useEffect, useState } from 'react';
import { CheckCheck, Receipt, Send } from 'lucide-react';

import { cn } from '@web/lib/utils';

import { NotificationToast } from './notification-toast';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';
import { useInView } from './use-in-view';

const START_DELAY_MS = 300;
const STAGGER_MS = 600;

// Positions sit on the ends of the `scatter` circuit traces. Below lg the
// first two stack above the card so they never cover the share amounts.
const TOASTS = [
  {
    title: 'New Expense Added',
    amount: 1200,
    icon: <Receipt aria-hidden className="h-4 w-4" />,
    position: 'left-0 top-0 lg:top-[8%]',
  },
  {
    title: 'Payment Sent',
    amount: 400,
    icon: <Send aria-hidden className="h-4 w-4" />,
    position: 'right-0 top-[60px] lg:top-[74%]',
  },
  {
    title: 'Split Confirmed',
    icon: <CheckCheck aria-hidden className="h-4 w-4" />,
    position: 'bottom-0 left-[4%] lg:bottom-[6%]',
  },
] as const;

/**
 * Reveals the hero toasts one after another the first time the hero is in
 * view. Copy is server-rendered; only visibility changes after mount.
 */
export function HeroToasts() {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: true,
    threshold: 0.3,
  });
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setShown(TOASTS.length);
      return;
    }
    const timers = TOASTS.map((_, i) =>
      window.setTimeout(
        () => setShown((n) => Math.max(n, i + 1)),
        START_DELAY_MS + i * STAGGER_MS,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, reduced]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20">
      {TOASTS.map((toast, i) => (
        <NotificationToast
          key={toast.title}
          icon={toast.icon}
          title={toast.title}
          amount={'amount' in toast ? toast.amount : undefined}
          className={cn(
            'absolute w-max max-w-[calc(100%-1rem)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            toast.position,
            i < shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        />
      ))}
    </div>
  );
}
