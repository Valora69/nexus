import * as React from 'react';

import { cn } from '@web/lib/utils';

type Variant = 'default' | 'elevated' | 'flat';
type Padding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

const variantClasses: Record<Variant, string> = {
  default: 'glass-card',
  elevated: 'glass-card-elevated',
  flat: 'rounded-2xl border border-border bg-card backdrop-blur-xl',
};

const paddingClasses: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      interactive,
      as = 'div',
      ...props
    },
    ref,
  ) => {
    const Tag = as as 'div';
    return (
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          interactive && 'hover-lift cursor-pointer',
          className,
        )}
        {...props}
      />
    );
  },
);
GlassCard.displayName = 'GlassCard';

export function CardHeader({
  title,
  action,
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('mb-4 flex items-center justify-between gap-3', className)}
    >
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
