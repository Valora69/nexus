import { View, type ViewProps } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

interface ScreenProps extends ViewProps {
  /** Safe-area edges to inset. Defaults to top + bottom. */
  edges?: readonly Edge[];
}

/**
 * Full-screen container with the app background and safe-area insets.
 * Background is set via style (guaranteed) while inner layout uses NativeWind.
 */
export function Screen({
  children,
  className,
  edges = ['top', 'bottom'],
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: '#0b0b0f' }}>
      <View className={cn('flex-1 px-5', className)} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
