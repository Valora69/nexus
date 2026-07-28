import { Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'label';

const VARIANTS: Record<Variant, string> = {
  title: 'text-white text-3xl font-bold',
  heading: 'text-white text-xl font-semibold',
  body: 'text-white text-base',
  muted: 'text-muted text-sm',
  label: 'text-muted text-xs uppercase tracking-wide',
};

interface Props extends TextProps {
  variant?: Variant;
}

export function Text({ variant = 'body', className, ...props }: Props) {
  return <RNText className={cn(VARIANTS[variant], className)} {...props} />;
}
