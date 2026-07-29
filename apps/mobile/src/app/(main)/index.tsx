import type { DashboardResponse, User } from '@repo/core';
import { useGetDashboard } from '@repo/core/queries/dashboardQueries';
import { useCurrentUser } from '@repo/core/queries/userQueries';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Button, Card, ErrorState, Loading, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { formatAmount } from '@/lib/format';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const user = useCurrentUser() as { data?: User };
  const dashboard = useGetDashboard() as {
    data?: DashboardResponse;
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  if (dashboard.isPending) {
    return (
      <Screen>
        <Loading label="Loading your dashboard…" />
      </Screen>
    );
  }

  if (dashboard.isError) {
    return (
      <Screen>
        <ErrorState
          message="Couldn't load your dashboard."
          onRetry={() => dashboard.refetch()}
        />
      </Screen>
    );
  }

  const d = dashboard.data;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-8 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => dashboard.refetch()}
            tintColor="#ffffff"
          />
        }
      >
        <View>
          <Text variant="muted">Welcome back</Text>
          <Text variant="title">{user.data?.name ?? 'Home'}</Text>
        </View>

        <Card>
          <Text variant="label">Net balance</Text>
          <Text variant="title" className="mt-1">
            {formatAmount(d?.netBalance)}
          </Text>
        </Card>

        <View className="flex-row gap-4">
          <Card className="flex-1">
            <Text variant="label">You are owed</Text>
            <Text variant="heading" className="mt-1">
              {formatAmount(d?.totalReceivable)}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text variant="label">You owe</Text>
            <Text variant="heading" className="mt-1">
              {formatAmount(d?.totalPayable)}
            </Text>
          </Card>
        </View>

        <Card>
          <Text variant="label">Spent {d?.monthLabel ?? 'this month'}</Text>
          <Text variant="heading" className="mt-1">
            {formatAmount(d?.spent)}
          </Text>
        </Card>

        <View>
          <Text variant="heading" className="mb-2">
            Recent activity
          </Text>
          {d?.recentFeed?.length ? (
            <View className="gap-2">
              {d.recentFeed.slice(0, 8).map((item, i) => (
                <Card key={`${item.id}-${i}`}>
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text variant="body">{item.label}</Text>
                      {item.sublabel ? (
                        <Text variant="muted" className="mt-0.5">
                          {item.sublabel}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      variant="body"
                      className={item.isCredit ? 'text-emerald-400' : 'text-white'}
                    >
                      {item.isCredit ? '+' : '−'}
                      {formatAmount(item.amount)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card>
              <Text variant="muted">No recent activity yet.</Text>
            </Card>
          )}
        </View>

        <Button
          title="Sign out"
          variant="secondary"
          onPress={() => void signOut()}
        />
      </ScrollView>
    </Screen>
  );
}
