import type { GroupWithRelations } from '@repo/core';
import { useGetGroupById } from '@repo/core/queries/groupQueries';
import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Card, ErrorState, Loading, Screen, Text } from '@/components/ui';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = useGetGroupById(id) as {
    data?: GroupWithRelations;
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  return (
    <Screen>
      <Stack.Screen
        options={{ headerShown: true, title: group.data?.name ?? 'Group' }}
      />

      {group.isPending ? (
        <Loading label="Loading group…" />
      ) : group.isError ? (
        <ErrorState
          message="Couldn't load this group."
          onRetry={() => group.refetch()}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 py-4"
          refreshControl={
            <RefreshControl
              refreshing={group.isRefetching}
              onRefresh={() => group.refetch()}
              tintColor="#ffffff"
            />
          }
        >
          <View>
            <Text variant="title">{group.data?.name}</Text>
            {group.data?.description ? (
              <Text variant="muted" className="mt-1">
                {group.data.description}
              </Text>
            ) : null}
          </View>

          <View>
            <Text variant="heading" className="mb-2">
              Members
            </Text>
            {group.data?.members?.length ? (
              <View className="gap-2">
                {group.data.members.map((m) => (
                  <Card key={m.id}>
                    <Text variant="body">{m.user.name}</Text>
                    <Text variant="muted" className="mt-0.5">
                      {m.user.email}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : (
              <Card>
                <Text variant="muted">No members yet.</Text>
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
