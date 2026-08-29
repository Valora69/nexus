/**
 * Centered empty-state block used by every list screen with no rows.
 * Keeps voice + spacing consistent across tabs.
 */

import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      {icon ? <View className="mb-1">{icon}</View> : null}
      <Text className="text-foreground font-sans-semibold text-lg text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-muted font-sans text-sm text-center">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}
