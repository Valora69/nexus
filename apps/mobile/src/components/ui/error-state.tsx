/**
 * Centered failure block for TanStack Query errors. Accepts the raw
 * `error` from a query and pulls its `.message` if present; otherwise
 * falls back to a generic string. An optional retry hook is wired to a
 * ghost `PillButton` so screens don't need to import it themselves.
 */

import { Text, View } from 'react-native';

import { PillButton } from './pill-button';

type Props = {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
};

function messageOf(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const raw = (error as { message: unknown }).message;
    if (typeof raw === 'string' && raw.length > 0) return raw;
  }
  return 'Something went wrong. Please try again.';
}

export function ErrorState({ title = "Couldn't load", error, onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <Text className="text-foreground font-sans-semibold text-lg text-center">
        {title}
      </Text>
      <Text className="text-muted font-sans text-sm text-center">
        {messageOf(error)}
      </Text>
      {onRetry ? (
        <View className="mt-2">
          <PillButton label="Try again" variant="ghost" size="sm" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
