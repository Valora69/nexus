import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export function Card({ children, className, ...props }: ViewProps) {
  return (
    <View
      className={cn('rounded-2xl border border-border bg-surface p-4', className)}
      {...props}
    >
      {children}
    </View>
  );
}
