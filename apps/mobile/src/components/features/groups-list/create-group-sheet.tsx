/**
 * Create-group bottom sheet. Fields: name (required), description,
 * member picker (multi-select from friends). Server implicitly adds
 * the current user as a member, so this picker starts empty.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Friend } from '@repo/shared/types/entities';

import {
  GlassCard,
  ModalSheet,
  PillButton,
  TextField,
} from '../../ui';
import { useCreateGroup } from '../../../lib/api/mutations/groupMutations';
import { useGetAllFriends } from '../../../lib/api/queries/friendQueries';

export function CreateGroupSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const friendsQuery = useGetAllFriends();

  const createMutation = useCreateGroup({
    onSuccess: () => {
      resetAndClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to create group');
    },
  });

  const resetAndClose = () => {
    setName('');
    setDescription('');
    setSelectedIds([]);
    setError(null);
    onClose();
  };

  const handleClose = () => {
    if (createMutation.isPending) return;
    resetAndClose();
  };

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    setError(null);
    createMutation.mutate({
      groupData: {
        name: trimmedName,
        description: description.trim() || undefined,
        memberIds: selectedIds,
      },
    });
  };

  const friends = friendsQuery.data ?? [];
  const canSubmit = name.trim().length > 0 && !createMutation.isPending;

  return (
    <ModalSheet
      visible={visible}
      onClose={handleClose}
      title="New group"
      subtitle="Split shared expenses with friends."
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PillButton
              label="Cancel"
              variant="ghost"
              onPress={handleClose}
              disabled={createMutation.isPending}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Create"
              variant="primary"
              onPress={handleCreate}
              disabled={!canSubmit}
              loading={createMutation.isPending}
            />
          </View>
        </View>
      }
    >
      <View className="gap-4">
        <TextField
          label="Name"
          placeholder="Boracay trip"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          maxLength={100}
          returnKeyType="next"
          error={error}
        />
        <TextField
          label="Description"
          placeholder="Optional"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={280}
        />
        <FriendPicker
          friends={friends}
          isLoading={friendsQuery.isLoading}
          selectedIds={selectedIds}
          onToggle={toggleFriend}
        />
      </View>
    </ModalSheet>
  );
}

function FriendPicker({
  friends,
  isLoading,
  selectedIds,
  onToggle,
}: {
  friends: Friend[];
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selectedCount = selectedIds.length;

  const heading = useMemo(() => {
    if (selectedCount === 0) return 'Add members';
    return `Add members (${selectedCount})`;
  }, [selectedCount]);

  if (isLoading) {
    return (
      <View className="gap-1.5">
        <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
          {heading}
        </Text>
        <GlassCard>
          <Text className="text-muted font-sans text-sm">Loading friends…</Text>
        </GlassCard>
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View className="gap-1.5">
        <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
          {heading}
        </Text>
        <GlassCard>
          <Text className="text-muted font-sans text-sm">
            You don't have any friends yet. Add friends first to invite them
            when creating a group.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
        {heading}
      </Text>
      <View className="gap-2 max-h-72">
        <ScrollView
          className="max-h-72"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View className="gap-2">
            {friends.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                selected={selectedIds.includes(friend.id)}
                onPress={() => onToggle(friend.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function FriendRow({
  friend,
  selected,
  onPress,
}: {
  friend: Friend;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={friend.name}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-xl border p-3 active:bg-card-hover ${
        selected ? 'border-accent bg-card-strong' : 'border-border bg-card'
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border ${
          selected ? 'bg-accent border-accent' : 'border-border-strong'
        }`}
      >
        {selected ? (
          <Ionicons name="checkmark" size={14} color="#000000" />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-sans-medium text-sm" numberOfLines={1}>
          {friend.name}
        </Text>
        <Text className="text-muted font-sans text-xs" numberOfLines={1}>
          {friend.email}
        </Text>
      </View>
    </Pressable>
  );
}
