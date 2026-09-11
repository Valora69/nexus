/**
 * Sync-status strip: sibling to `OfflineBanner` (also rendered inside
 * `<Screen>`) that surfaces the outbox state whenever there is
 * queued or failed work. Silent when the outbox is empty.
 *
 * Two shapes:
 *   - Pending / syncing → neutral accent chip with a count. Tapping
 *     opens the outbox screen so the user can inspect / retry.
 *   - Failed → loss-colored variant with the same tap target. Even
 *     one failed row promotes the strip to the loss variant so the
 *     user can't miss a stuck write.
 *
 * Reads counts through `useOutboxCounts` (subscribes to the outbox
 * change notifier) so it re-renders on every enqueue, replay success,
 * or retry without polling.
 */

import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useOutboxCounts } from '../../lib/offline';

export function SyncStatusStrip() {
  const router = useRouter();
  const counts = useOutboxCounts();
  if (!counts || counts.total === 0) return null;

  const hasFailed = counts.failed > 0;
  const inflight = counts.pending + counts.syncing;

  const parts: string[] = [];
  if (inflight > 0) {
    parts.push(
      `${inflight} pending${counts.syncing > 0 ? ' (syncing…)' : ''}`,
    );
  }
  if (counts.failed > 0) parts.push(`${counts.failed} failed`);

  const tone = hasFailed
    ? 'bg-loss/15 border-b border-loss/30'
    : 'bg-accent/10 border-b border-accent/30';
  const text = hasFailed ? 'text-loss' : 'text-accent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open sync queue"
      onPress={() => router.push('/outbox')}
      className={`${tone} px-4 py-2`}
    >
      <View className="flex-row items-center justify-center gap-2">
        <Text className={`${text} text-xs font-medium`}>{parts.join(' · ')}</Text>
        <Text className={`${text} text-xs`}>→</Text>
      </View>
    </Pressable>
  );
}
