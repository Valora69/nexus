/**
 * Accepted-friend row. Long-press surfaces a "Remove friend" action
 * (a destructive path we don't want a stray tap to trigger).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, Text, View } from 'react-native';

import type { Friend } from '@repo/shared/types/entities';

import { useRemoveFriend } from '../../../lib/api/mutations/friendMutations';
import { colors } from '../../../lib/theme';
import { Avatar, GlassCard } from '../../ui';

export function FriendRow({ friend }: { friend: Friend }) {
  const remove = useRemoveFriend({
    onError: (err) =>
      Alert.alert('Could not remove friend', err.message || 'Please try again.'),
  });

  const confirmRemove = () => {
    Alert.alert(
      `Remove ${friend.name}?`,
      'They will no longer appear as a friend or in your group picker.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => remove.mutate({ friendId: friend.id }),
        },
      ],
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${friend.name}, long press to remove`}
      onLongPress={confirmRemove}
      delayLongPress={350}
      disabled={remove.isPending}
    >
      <GlassCard>
        <View className="flex-row items-center gap-3">
          <Avatar uri={friend.picture ?? null} name={friend.name} size={40} />
          <View className="flex-1">
            <Text
              className="text-foreground font-sans-medium text-sm"
              numberOfLines={1}
            >
              {friend.name}
            </Text>
            <Text
              className="text-muted font-sans text-xs mt-0.5"
              numberOfLines={1}
            >
              {friend.email}
            </Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </View>
      </GlassCard>
    </Pressable>
  );
}
