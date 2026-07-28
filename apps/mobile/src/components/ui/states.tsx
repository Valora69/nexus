import { ActivityIndicator, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';

/** Centered spinner — the standard loading state. */
export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator color="#ffffff" />
      {label ? <Text variant="muted">{label}</Text> : null}
    </View>
  );
}

/** Centered empty state with a title and optional hint. */
export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8">
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {hint ? (
        <Text variant="muted" className="text-center">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Centered error state with an optional retry action. */
export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <Text variant="body" className="text-center">
        {message}
      </Text>
      {onRetry ? (
        <Button title="Try again" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
