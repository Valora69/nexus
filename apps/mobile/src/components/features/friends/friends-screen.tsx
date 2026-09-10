/**
 * Friends tab — the full request lifecycle in one screen.
 *
 * Three list sections rendered as one ScrollView so a single pull-to-
 * refresh re-fetches every domain query. We pick FlatList's virtualization
 * up only inside groups when the list gets long enough to warrant it; for
 * now the modest counts (dozens, not hundreds) fit comfortably in a
 * plain ScrollView + View.map.
 *
 * The invite-by-email affordance opens a bottom sheet that fires
 * `POST /api/friend/request`; the server does the Resend email delivery.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  useGetAllFriends,
  useGetPendingRequests,
  useGetSentRequests,
} from '../../../lib/api/queries/friendQueries';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import { EmptyState, ErrorState, LoadingState, Screen } from '../../ui';
import { FriendRow } from './friend-row';
import { IncomingRequestRow } from './incoming-request-row';
import { InviteFriendSheet } from './invite-friend-sheet';
import { SentRequestRow } from './sent-request-row';

export function FriendsScreen() {
  const friendsQuery = useGetAllFriends();
  const incomingQuery = useGetPendingRequests();
  const sentQuery = useGetSentRequests();
  const [inviteOpen, setInviteOpen] = useState(false);

  const onRefresh = useCallback(() => {
    void friendsQuery.refetch();
    void incomingQuery.refetch();
    void sentQuery.refetch();
  }, [friendsQuery, incomingQuery, sentQuery]);

  const isInitialLoading =
    friendsQuery.isLoading ||
    incomingQuery.isLoading ||
    sentQuery.isLoading;

  const firstError =
    friendsQuery.error ?? incomingQuery.error ?? sentQuery.error;

  const refreshing =
    (friendsQuery.isFetching && !friendsQuery.isLoading) ||
    (incomingQuery.isFetching && !incomingQuery.isLoading) ||
    (sentQuery.isFetching && !sentQuery.isLoading);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-6 pt-6 flex-row items-center justify-between">
        <Text className="text-foreground font-sans-bold text-3xl">Friends</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invite a friend by email"
          onPress={() => setInviteOpen(true)}
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <Ionicons name="person-add" size={20} color="#000000" />
        </Pressable>
      </View>

      {isInitialLoading ? (
        <LoadingState />
      ) : firstError ? (
        <ErrorState error={firstError} onRetry={onRefresh} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 32,
            gap: 24,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
        >
          <FriendsBody
            friends={friendsQuery.data ?? []}
            incoming={incomingQuery.data ?? []}
            sent={sentQuery.data ?? []}
            onInvitePress={() => setInviteOpen(true)}
          />
        </ScrollView>
      )}

      <InviteFriendSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </Screen>
  );
}

type BodyProps = {
  friends: import('@repo/shared/types/entities').Friend[];
  incoming: import('@repo/shared/types/entities').FriendRequestWithRelations[];
  sent: import('@repo/shared/types/entities').FriendRequestWithRelations[];
  onInvitePress: () => void;
};

function FriendsBody({ friends, incoming, sent, onInvitePress }: BodyProps) {
  const everythingEmpty =
    friends.length === 0 && incoming.length === 0 && sent.length === 0;

  if (everythingEmpty) {
    return (
      <EmptyState
        title="No friends yet"
        description="Invite someone by email to split expenses together."
        action={
          <Pressable
            accessibilityRole="button"
            onPress={onInvitePress}
            className="flex-row items-center gap-2 rounded-full bg-accent px-5 py-2.5 active:opacity-80"
          >
            <Ionicons name="person-add" size={16} color="#000000" />
            <Text className="text-accent-foreground font-sans-semibold text-sm">
              Invite a friend
            </Text>
          </Pressable>
        }
      />
    );
  }

  return (
    <View className="gap-6">
      {incoming.length > 0 ? (
        <View className="gap-3">
          <SectionHeader title="Incoming requests" count={incoming.length} />
          <View className="gap-3">
            {incoming.map((request) => (
              <IncomingRequestRow key={request.id} request={request} />
            ))}
          </View>
        </View>
      ) : null}

      {sent.length > 0 ? (
        <View className="gap-3">
          <SectionHeader title="Sent invites" count={sent.length} />
          <View className="gap-3">
            {sent.map((request) => (
              <SentRequestRow key={request.id} request={request} />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-3">
        <SectionHeader title="Friends" count={friends.length} />
        {friends.length === 0 ? (
          <Text className="text-muted font-sans text-sm">
            You haven't added any friends yet.
          </Text>
        ) : (
          <View className="gap-3">
            {friends.map((friend) => (
              <FriendRow key={friend.id} friend={friend} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-baseline gap-2">
      <Text className="text-foreground font-sans-semibold text-base">
        {title}
      </Text>
      <Text className="text-muted font-sans text-xs">({count})</Text>
    </View>
  );
}
