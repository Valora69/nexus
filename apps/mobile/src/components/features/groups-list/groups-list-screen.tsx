/**
 * Groups tab — mobile mirror of web's `/groups` list.
 *
 * Data flows from `useGetAllGroups`. A single "New group" bottom sheet
 * handles create; taps on a group card route to `/(app)/groups/[id]`.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  PillButton,
  Screen,
} from '../../ui';
import { useGetAllGroups } from '../../../lib/api/queries/groupQueries';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import { CreateGroupSheet } from './create-group-sheet';
import { GroupRow } from './group-row';

export function GroupsListScreen() {
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
        <ErrorState error={groupsQuery.error} onRetry={() => groupsQuery.refetch()} />
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
        <GroupRow group={item} onPress={() => onGroupPress(item.id)} />
      )}
    />
  );
}
