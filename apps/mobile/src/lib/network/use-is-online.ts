/**
 * Reactive read of TanStack Query's `onlineManager` — the single source of
 * truth for "does the app currently think it can reach the network."
 *
 * Components should prefer this over subscribing to NetInfo directly so the
 * banner, disabled states, and refetch behavior all agree.
 */

import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true, // SSR / initial paint — assume online to avoid a flash of banner
  );
}
