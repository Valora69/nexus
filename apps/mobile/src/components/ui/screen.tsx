/**
 * Every top-level screen renders inside `<Screen>` — it owns the safe
 * area insets and the pure-black background so individual screens don't
 * repeat that boilerplate (and don't drift on it).
 *
 * `edges` defaults to top+bottom+left+right; screens that host a scroll
 * view under a tab bar should pass `edges={['top', 'left', 'right']}` so
 * scroll content extends behind the tab bar.
 */

import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  edges?: readonly Edge[];
  className?: string;
  style?: ViewProps['style'];
}>;

export function Screen({ children, edges, className, style }: Props) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background" style={style}>
      <View className={`flex-1 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
