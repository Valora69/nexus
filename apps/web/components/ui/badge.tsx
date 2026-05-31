import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@web/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-accent/25 bg-[rgb(var(--color-accent)/0.12)] text-accent',
        accent:
          'border-accent/25 bg-[rgb(var(--color-accent)/0.12)] text-accent',
        gain: 'border-[rgb(var(--color-gain)/0.25)] bg-[rgb(var(--color-gain)/0.12)] text-gain',
        loss: 'border-[rgb(var(--color-loss)/0.25)] bg-[rgb(var(--color-loss)/0.12)] text-loss',
        neutral: 'border-border bg-card text-foreground backdrop-blur-xl',
        secondary: 'border-border bg-card text-foreground backdrop-blur-xl',
        destructive:
          'border-[rgb(var(--color-loss)/0.25)] bg-[rgb(var(--color-loss)/0.12)] text-loss',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

function Dot({
  tone = 'accent',
  ping,
  className,
}: {
  tone?: 'accent' | 'gain' | 'loss' | 'muted';
  ping?: boolean;
  className?: string;
}) {
  const toneClass =
    tone === 'gain'
      ? 'bg-gain'
      : tone === 'loss'
        ? 'bg-loss'
        : tone === 'muted'
          ? 'bg-muted'
          : 'bg-accent';
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      {ping && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            toneClass,
          )}
        />
      )}
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', toneClass)}
      />
    </span>
  );
}

export { Badge, badgeVariants, Dot };
