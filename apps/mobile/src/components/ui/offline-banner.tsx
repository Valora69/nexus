/**
 * Slim strip that appears above every screen's content whenever the
 * global `onlineManager` reports offline. It's the single, always-present
 * cue that "what you're seeing is cached and mutations won't stick" — so
 * individual screens don't each roll their own inline warnings.
 *
 * Kept intentionally shallow: no animation, no dismiss button, no toast
 * queue. If the banner is on screen, the app is offline; if it's gone,
 * the app just reconnected and TanStack Query is already refetching.
 */

import { Text, View } from 'react-native';

import { useIsOnline } from '../../lib/network';

export function OfflineBanner() {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  return (
    <View
      accessibilityRole="alert"
      className="bg-loss/15 border-b border-loss/30 px-4 py-2"
    >
      <Text className="text-loss text-xs font-medium text-center">
        Offline — showing cached data
      </Text>
    </View>
  );
}
