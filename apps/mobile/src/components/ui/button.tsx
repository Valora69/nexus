import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary';

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

const BASE =
  'min-h-[50px] items-center justify-center rounded-xl px-6 py-3.5';
const VARIANTS: Record<Variant, { box: string; text: string; spinner: string }> =
  {
    primary: { box: 'bg-white', text: 'text-black font-semibold text-base', spinner: '#0b0b0f' },
    secondary: {
      box: 'border border-border',
      text: 'text-white font-semibold text-base',
      spinner: '#ffffff',
    },
  };

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: Props) {
  const v = VARIANTS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(BASE, v.box, 'active:opacity-60', isDisabled && 'opacity-60')}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} />
      ) : (
        <Text className={v.text}>{title}</Text>
      )}
    </Pressable>
  );
}
