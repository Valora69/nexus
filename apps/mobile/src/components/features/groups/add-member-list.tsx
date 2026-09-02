import { Text, View } from 'react-native';

import type { Friend } from '@repo/shared/types/entities';

import { Avatar, EmptyState, PillButton } from '../../ui';

export function AddMemberList({
  friends,
  inviteableFriends,
  isLoading,
  pendingUserId,
  onAdd,
}: {
  friends: Friend[];
  inviteableFriends: Friend[];
  isLoading: boolean;
  pendingUserId: string | undefined;
  onAdd: (friend: Friend) => void;
}) {
  if (isLoading) {
    return <Text className="text-muted font-sans text-sm">Loading friends…</Text>;
  }
  if (friends.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        description="Once you connect with friends, invite them here."
      />
    );
  }
  if (inviteableFriends.length === 0) {
    return (
      <Text className="text-muted font-sans text-sm">
        All of your friends are already in this group.
      </Text>
    );
  }
  return (
    <View className="gap-3">
      {inviteableFriends.map((f) => (
        <View key={f.id} className="flex-row items-center gap-3">
          <Avatar uri={f.picture ?? null} name={f.name} size={40} />
          <View className="flex-1">
            <Text
              className="text-foreground font-sans-medium text-sm"
              numberOfLines={1}
            >
              {f.name}
            </Text>
            <Text className="text-muted font-sans text-xs" numberOfLines={1}>
              {f.email}
            </Text>
          </View>
          <PillButton
            label="Add"
            variant="primary"
            size="sm"
            loading={pendingUserId === f.id}
            disabled={pendingUserId === f.id}
            onPress={() => onAdd(f)}
          />
        </View>
      ))}
    </View>
  );
}
