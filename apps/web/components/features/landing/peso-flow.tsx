'use client';

import NumberFlow from '@number-flow/react';

import { cn } from '@web/lib/utils';

import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

// Same output as `formatPeso` (₱1,234.50), but rolling between values.
const PESO_FORMAT = {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

type PesoFlowProps = {
  value: number;
  className?: string;
};

/**
 * A ₱ amount that rolls digit by digit when it changes (@number-flow/react).
 * Its ESM-only dependencies can't load in Jest, so specs that render it mock
 * `@number-flow/react` with an Intl formatter.
 */
export function PesoFlow({ value, className }: PesoFlowProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <NumberFlow
      value={value}
      locales="en-PH"
      format={PESO_FORMAT}
      animated={!reduced}
      className={cn('font-mono tabular-nums', className)}
    />
  );
}
