/**
 * Group members screen — add from friends, remove existing.
 *
 * Two sections:
 *   1. Current members — each row has a Remove button (except the
 *      current user, since self-remove is a footgun on mobile; web
 *      allows it but bounces the user out of the group screen).
 *   2. Add from friends — friends who are not already members.
 *
 * Remove failures with 409 conflicts render an inline list of blockers
 * beneath the row instead of a toast — the messages ("Owes ₱X on Y")
 * only make sense next to the member they refer to.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import type { Friend } from '@repo/shared/types/entities';

import {
  Avatar,
  EmptyState,
  ErrorState,
  GlassCard,
  LoadingState,
  PillButton,
  Screen,
} from '../../../../components/ui';
import { ApiError } from '../../../../lib/api/client';
import {
  useCreateGroupMember,
  useRemoveGroupMember,
} from '../../../../lib/api/mutations/groupMemberMutations';
import { useGetGroupById } from '../../../../lib/api/queries/groupQueries';
import { useGetAllFriends } from '../../../../lib/api/queries/friendQueries';
import { useCurrentUser } from '../../../../lib/api/queries/userQueries';
import {
  type RemovalBlocker,
  RemoveMemberConflictError,
} from '../../../../lib/api/services/groupMemberService';
import { BRAND_ACCENT_HEX, colors } from '../../../../lib/theme';

export default function GroupMembersScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const groupId = Array.isArray(rawId) ? rawId[0] : rawId;

  const groupQuery = useGetGroupById(groupId);
  const meQuery = useCurrentUser();
  const friendsQuery = useGetAllFriends();

  const [blockersByMemberId, setBlockersByMemberId] = useState<
    Record<string, RemovalBlocker[]>
  >({});

  const addMember = useCreateGroupMember({
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add member';
      Alert.alert('Cannot add member', message);
    },
  });

  const removeMember = useRemoveGroupMember({
    onError: (err, variables) => {
      if (err instanceof RemoveMemberConflictError) {
        setBlockersByMemberId((prev) => ({
          ...prev,
          [variables.id]: err.blockers,
        }));
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to remove member';
      Alert.alert('Cannot remove member', message);
    },
    onSuccess: (_data, variables) => {
      setBlockersByMemberId((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
  });

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else if (groupId) router.replace(`/(app)/groups/${groupId}`);
  };

  const currentUserId = meQuery.data?.id;
  const members = groupQuery.data?.members ?? [];
  const memberUserIds = useMemo(
    () => new Set(members.map((m) => m.user?.id).filter(Boolean) as string[]),
    [members],
  );
  const friends = friendsQuery.data ?? [];
  const inviteableFriends = friends.filter((f) => !memberUserIds.has(f.id));

  const handleRemove = (memberId: string, name: string) => {
    Alert.alert(
      'Remove member?',
      `Remove ${name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember.mutate({ id: memberId }),
        },
      ],
    );
  };

  const handleAdd = (friend: Friend) => {
    if (!groupId) return;
    addMember.mutate({
      groupMemberData: { groupId, userId: friend.id },
    });
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text
          className="flex-1 text-foreground font-sans-bold text-xl"
          numberOfLines={1}
        >
          Manage members
        </Text>
      </View>

      {groupQuery.isLoading ? (
        <LoadingState />
      ) : groupQuery.isError ? (
        <ErrorState
          error={groupQuery.error}
          onRetry={() => groupQuery.refetch()}
        />
      ) : !groupQuery.data ? (
        <ErrorState title="Group not found" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={groupQuery.isFetching && !groupQuery.isLoading}
              onRefresh={() => {
                groupQuery.refetch();
                friendsQuery.refetch();
              }}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
        >
          <GlassCard>
            <SectionHeader
              icon="people-outline"
              title={`Current members (${members.length})`}
            />
            <View className="mt-3 gap-3">
              {members.length === 0 ? (
                <Text className="text-muted font-sans text-sm">
                  No members yet.
                </Text>
              ) : (
                members.map((m) => {
                  const isMe = m.user?.id === currentUserId;
                  const isPending =
                    removeMember.isPending &&
                    removeMember.variables?.id === m.id;
                  const memberBlockers = blockersByMemberId[m.id];
                  return (
                    <View key={m.id} className="gap-2">
                      <View className="flex-row items-center gap-3">
                        <Avatar name={m.user?.name ?? '?'} size={40} />
                        <View className="flex-1">
                          <Text
                            className="text-foreground font-sans-medium text-sm"
                            numberOfLines={1}
                          >
                            {m.user?.name ?? 'Unknown'}
                            {isMe ? (
                              <Text className="text-muted font-sans text-xs">
                                {' '}
                                (you)
                              </Text>
                            ) : null}
                          </Text>
                          <Text
                            className="text-muted font-sans text-xs"
                            numberOfLines={1}
                          >
                            {m.user?.email ?? ''}
                          </Text>
                        </View>
                        {isMe ? null : (
                          <PillButton
                            label="Remove"
                            variant="ghost"
                            size="sm"
                            loading={isPending}
                            disabled={isPending}
                            onPress={() =>
                              handleRemove(m.id, m.user?.name ?? 'this member')
                            }
                          />
                        )}
                      </View>
                      {memberBlockers && memberBlockers.length > 0 ? (
                        <View className="rounded-xl border border-loss/40 bg-loss/10 p-3 gap-1">
                          <Text className="text-loss font-sans-semibold text-xs uppercase tracking-wider">
                            Cannot remove — unsettled balances
                          </Text>
                          {memberBlockers.map((b, i) => (
                            <Text
                              key={`${b.type}-${i}`}
                              className="text-foreground font-sans text-xs"
                            >
                              • {b.message}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </GlassCard>

          <GlassCard>
            <SectionHeader
              icon="person-add-outline"
              title="Add from friends"
            />
            <View className="mt-3">
              {friendsQuery.isLoading ? (
                <Text className="text-muted font-sans text-sm">
                  Loading friends…
                </Text>
              ) : friends.length === 0 ? (
                <EmptyState
                  title="No friends yet"
                  description="Once you connect with friends, invite them here."
                />
              ) : inviteableFriends.length === 0 ? (
                <Text className="text-muted font-sans text-sm">
                  All of your friends are already in this group.
                </Text>
              ) : (
                <View className="gap-3">
                  {inviteableFriends.map((f) => {
                    const isPending =
                      addMember.isPending &&
                      addMember.variables?.groupMemberData.userId === f.id;
                    return (
                      <View
                        key={f.id}
                        className="flex-row items-center gap-3"
                      >
                        <Avatar
                          uri={f.picture ?? null}
                          name={f.name}
                          size={40}
                        />
                        <View className="flex-1">
                          <Text
                            className="text-foreground font-sans-medium text-sm"
                            numberOfLines={1}
                          >
                            {f.name}
                          </Text>
                          <Text
                            className="text-muted font-sans text-xs"
                            numberOfLines={1}
                          >
                            {f.email}
                          </Text>
                        </View>
                        <PillButton
                          label="Add"
                          variant="primary"
                          size="sm"
                          loading={isPending}
                          disabled={isPending}
                          onPress={() => handleAdd(f)}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </GlassCard>
        </ScrollView>
      )}
    </Screen>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={18} color={BRAND_ACCENT_HEX} />
      <Text className="text-foreground font-sans-semibold text-base">
        {title}
      </Text>
    </View>
  );
}
