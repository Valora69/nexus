/**
 * Currency display primitive — JetBrains Mono with tabular numerals so
 * columns of amounts line up on the decimal, and semantic colors so a
 * positive amount reads green and a negative amount reads red without
 * any per-callsite styling.
 *
 * Neutral rendering (`tone="neutral"`) keeps the foreground color, for
 * places like total-owed rows where sign carries no gain/loss meaning.
 * `signed` forces a leading `+`/`−` for delta displays.
 */

import { Text, type TextProps } from 'react-native';

import { formatCurrency, formatCurrencyWithSign, type CurrencyCode } from '@repo/shared';

type Tone = 'auto' | 'neutral' | 'gain' | 'loss';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const toneClass: Record<Exclude<Tone, 'auto'>, string> = {
  neutral: 'text-foreground',
  gain: 'text-gain',
  loss: 'text-loss',
};

type Props = Omit<TextProps, 'children'> & {
  value: number;
  currency?: CurrencyCode;
  /** `auto` picks gain/loss/neutral from the sign. */
  tone?: Tone;
  size?: Size;
  /** Force a leading `+` on positive numbers. */
  signed?: boolean;
};

export function Amount({
  value,
  currency = 'PHP',
  tone = 'auto',
  size = 'md',
  signed = false,
  className,
  style,
  ...rest
}: Props) {
  const resolvedTone: Exclude<Tone, 'auto'> =
    tone === 'auto' ? (value > 0 ? 'gain' : value < 0 ? 'loss' : 'neutral') : tone;
  const text = signed
    ? formatCurrencyWithSign(value, currency)
    : formatCurrency(value, currency);
  return (
    <Text
      className={`font-mono-medium ${sizeClass[size]} ${toneClass[resolvedTone]} ${className ?? ''}`}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      {...rest}
    >
      {text}
    </Text>
  );
}
