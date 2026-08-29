/**
 * Rounded-full button matching web's primary CTA. Three variants:
 *
 *   - `primary`   — neon accent fill on black text (main CTA)
 *   - `secondary` — translucent glass fill on foreground text (default)
 *   - `ghost`     — no fill, just a border (dismiss / tertiary)
 *
 * Disabled and pending states reduce opacity uniformly so callers can
 * flip a query's `isPending` into `disabled` without a spinner.
 */

import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

const containerClass: Record<Variant, string> = {
  primary: 'bg-accent active:opacity-80',
  secondary: 'bg-card border border-border active:bg-card-hover',
  ghost: 'border border-border-strong active:bg-card',
};

const labelClass: Record<Variant, string> = {
  primary: 'text-accent-foreground font-sans-semibold',
  secondary: 'text-foreground font-sans-medium',
  ghost: 'text-foreground font-sans-medium',
};

const sizeClass: Record<Size, string> = {
  md: 'px-6 py-3',
  sm: 'px-4 py-2',
};

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function PillButton({
  label,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 rounded-full ${sizeClass[size]} ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''} ${typeof className === 'string' ? className : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#000000' : '#e8edf4'}
        />
      ) : null}
      <Text className={`${labelClass[variant]} text-sm`}>{label}</Text>
    </Pressable>
  );
}
