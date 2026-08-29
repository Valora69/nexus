/**
 * Translucent card surface — the mobile equivalent of the "glass" cards
 * on web. React Native has no backdrop-filter, so we approximate with a
 * flat translucent white fill over the pure-black background; visually
 * indistinguishable at the opacities web uses (~5–10%).
 *
 * Pass `variant="strong"` for a slightly opaquer surface used by nested
 * cards, or `variant="hover"` for the pressed/highlighted state.
 */

import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

type Variant = 'default' | 'strong' | 'hover';

const surfaceClass: Record<Variant, string> = {
  default: 'bg-card border-border',
  strong: 'bg-card-strong border-border-strong',
  hover: 'bg-card-hover border-border-strong',
};

type Props = PropsWithChildren<{
  variant?: Variant;
  className?: string;
  style?: ViewProps['style'];
}>;

export function GlassCard({ children, variant = 'default', className, style }: Props) {
  return (
    <View
      className={`rounded-2xl border p-4 ${surfaceClass[variant]} ${className ?? ''}`}
      style={style}
    >
      {children}
    </View>
  );
}
