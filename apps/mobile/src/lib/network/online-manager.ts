/**
 * Wires TanStack Query's global `onlineManager` and `focusManager` to the
 * device's connectivity and lifecycle signals.
 *
 * - Connectivity: `@react-native-community/netinfo` — a change fires
 *   `onlineManager.setOnline(...)`, which flips paused queries back on and
 *   triggers `refetchOnReconnect`.
 * - Focus: React Native has no window `focus` event, so `focusManager` is
 *   fed from `AppState` — coming back to `active` counts as a refocus and
 *   triggers `refetchOnWindowFocus` (which we leave at its default).
 *
 * Called exactly once from the root layout. Idempotent — a hot-reload
 * that re-runs the module returns the same teardown fn.
 */

import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

let installed = false;

export function installOnlineManager(): () => void {
  if (installed) return () => {};
  installed = true;

  // NetInfo's callback fires with the *current* state on subscribe and on
  // every change afterwards — perfect for keeping onlineManager in sync
  // without a separate priming call.
  //
  // `setEventListener` registers the callback but doesn't return a
  // teardown; TQ invokes the inner cleanup when the listener is replaced
  // or the manager is destroyed. We track the NetInfo unsubscribe on the
  // side so hot-reload teardown can still detach it directly.
  let netInfoUnsubscribe: (() => void) | null = null;
  onlineManager.setEventListener((setOnline) => {
    netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` can be `null` on cold start before the OS
      // has probed the network — treat null as "assume online" so we
      // don't briefly show the offline banner during the boot race.
      const reachable = state.isInternetReachable ?? state.isConnected ?? true;
      setOnline(Boolean(reachable));
    });
    return () => {
      netInfoUnsubscribe?.();
      netInfoUnsubscribe = null;
    };
  });

  const focusHandler = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  const appStateSubscription = AppState.addEventListener('change', focusHandler);

  return () => {
    netInfoUnsubscribe?.();
    netInfoUnsubscribe = null;
    appStateSubscription.remove();
    installed = false;
  };
}
