/**
 * A friend request the current user has sent that is still pending. The
 * recipient may or may not have an account yet — if they don't, the
 * server records `recipientEmail` only and shows that instead.
 */

import { Text, View } from 'react-native';

import type { FriendRequestWithRelations } from '@repo/shared/types/entities';

import { Avatar, GlassCard } from '../../ui';

export function SentRequestRow({
  request,
}: {
  request: FriendRequestWithRelations;
}) {
  const displayName = request.recipient?.name ?? request.recipientEmail;
  const displayEmail =
    request.recipient?.email ?? request.recipientEmail;

  return (
    <GlassCard>
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={request.recipient?.picture ?? null}
          name={displayName}
          size={40}
        />
        <View className="flex-1">
          <Text
            className="text-foreground font-sans-medium text-sm"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            className="text-muted font-sans text-xs mt-0.5"
            numberOfLines={1}
          >
            {displayEmail}
          </Text>
        </View>
        <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
          Pending
        </Text>
      </View>
    </GlassCard>
  );
}
