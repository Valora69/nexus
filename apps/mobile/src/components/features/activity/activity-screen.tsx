/**
 * Activity tab — a running feed of group changes surfaced from
 * `GET /api/activity`. Server orders newest-first and we cap the first
 * page at 50 rows; infinite-scroll can layer on in a later stage without
 * changing the service or query shape.
 */

import { FlatList, RefreshControl, Text, View } from 'react-native';

import type { ActivityWithRelations } from '@repo/shared/types/entities';

import { useGetAllActivities } from '../../../lib/api/queries/activityQueries';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import { EmptyState, ErrorState, LoadingState, Screen } from '../../ui';
import { ActivityRow } from './activity-row';

const PAGE_SIZE = 50;

export function ActivityScreen() {
  const query = useGetAllActivities(0, PAGE_SIZE);
  const activities: ActivityWithRelations[] = query.data ?? [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Activity</Text>
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 32,
            gap: 12,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              title="Nothing yet"
              description="As you create groups, log expenses, and record payments, they'll show up here."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isFetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
          renderItem={({ item }) => <ActivityRow activity={item} />}
        />
      )}
    </Screen>
  );
}
