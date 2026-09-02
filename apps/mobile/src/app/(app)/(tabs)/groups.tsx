/**
 * Groups tab — mobile mirror of web's `/groups` list.
 *
 * Data flows from `useGetAllGroups`. A single "New group" bottom sheet
 * handles create; taps on a group card route to `/(app)/groups/[id]`.
 *
 * Members added at create-time come from the user's friend list, matching
 * web (`selectableUsers = friends`). The user's row is implicitly included
 * server-side, so the picker excludes the current user.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type { Friend, GroupWithRelations } from '@repo/shared/types/entities';

import {
  EmptyState,
  ErrorState,
  GlassCard,
  LoadingState,
  ModalSheet,
  PillButton,
  Screen,
  TextField,
} from '../../../components/ui';
import { useCreateGroup } from '../../../lib/api/mutations/groupMutations';
import { useGetAllGroups } from '../../../lib/api/queries/groupQueries';
import { useGetAllFriends } from '../../../lib/api/queries/friendQueries';
import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const groupsQuery = useGetAllGroups();
  const [sheetOpen, setSheetOpen] = useState(false);

  const openCreate = () => setSheetOpen(true);
  const closeCreate = () => setSheetOpen(false);

  const goToGroup = useCallback(
    (id: string) => router.push(`/(app)/groups/${id}`),
    [router],
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-6 pt-6 flex-row items-center justify-between">
        <Text className="text-foreground font-sans-bold text-3xl">Groups</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create a new group"
          onPress={openCreate}
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#000000" />
        </Pressable>
      </View>

      {groupsQuery.isLoading ? (
        <LoadingState />
      ) : groupsQuery.isError ? (
        <ErrorState
          error={groupsQuery.error}
          onRetry={() => groupsQuery.refetch()}
        />
      ) : (
        <GroupsList
          groups={groupsQuery.data ?? []}
          refreshing={groupsQuery.isFetching && !groupsQuery.isLoading}
          onRefresh={() => groupsQuery.refetch()}
          onGroupPress={goToGroup}
          onCreatePress={openCreate}
        />
      )}

      <CreateGroupSheet visible={sheetOpen} onClose={closeCreate} />
    </Screen>
  );
}

function GroupsList({
  groups,
  refreshing,
  onRefresh,
  onGroupPress,
  onCreatePress,
}: {
  groups: GroupWithRelations[];
  refreshing: boolean;
  onRefresh: () => void;
  onGroupPress: (id: string) => void;
  onCreatePress: () => void;
}) {
  if (groups.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND_ACCENT_HEX}
            colors={[BRAND_ACCENT_HEX]}
          />
        }
      >
        <EmptyState
          title="No groups yet"
          description="Start a group to split shared expenses with friends."
          action={
            <PillButton
              label="Create your first group"
              variant="primary"
              onPress={onCreatePress}
            />
          }
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.id}
      contentContainerStyle={{ padding: 24, gap: 12, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={BRAND_ACCENT_HEX}
          colors={[BRAND_ACCENT_HEX]}
        />
      }
      renderItem={({ item }) => (
        <GroupCard group={item} onPress={() => onGroupPress(item.id)} />
      )}
    />
  );
}

function GroupCard({
  group,
  onPress,
}: {
  group: GroupWithRelations;
  onPress: () => void;
}) {
  const memberCount = group.members?.length ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open group ${group.name}`}
      onPress={onPress}
      className="rounded-2xl border border-border bg-card active:bg-card-hover p-4"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="people-outline"
              size={18}
              color={BRAND_ACCENT_HEX}
            />
            <Text
              className="text-foreground font-sans-semibold text-lg"
              numberOfLines={1}
            >
              {group.name}
            </Text>
          </View>
          {group.description ? (
            <Text
              className="text-muted font-sans-light text-sm mt-1"
              numberOfLines={2}
            >
              {group.description}
            </Text>
          ) : null}
          <Text className="text-muted font-sans text-xs mt-2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
    </Pressable>
  );
}

/**
 * Create-group bottom sheet. Fields: name (required), description,
 * member picker (multi-select from friends). Server implicitly adds
 * the current user as a member, so this picker starts empty.
 */
function CreateGroupSheet({
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
          <Text className="text-muted font-sans text-sm">
            Loading friends…
          </Text>
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
        selected
          ? 'border-accent bg-card-strong'
          : 'border-border bg-card'
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
        <Text
          className="text-foreground font-sans-medium text-sm"
          numberOfLines={1}
        >
          {friend.name}
        </Text>
        <Text
          className="text-muted font-sans text-xs"
          numberOfLines={1}
        >
          {friend.email}
        </Text>
      </View>
    </Pressable>
  );
}
