/**
 * A pending friend request the current user has received. Renders the
 * sender identity + accept/decline actions.
 *
 * We disable both buttons while either mutation is in flight so a fast
 * double-tap can't fire accept AND decline against the same row.
 */

import { Alert, Text, View } from 'react-native';
import { useState } from 'react';

import type { FriendRequestWithRelations } from '@repo/shared/types/entities';

import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from '../../../lib/api/mutations/friendMutations';
import { Avatar, GlassCard, PillButton } from '../../ui';

export function IncomingRequestRow({
  request,
}: {
  request: FriendRequestWithRelations;
}) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const accept = useAcceptFriendRequest({
    onSettled: () => setBusy(null),
    onError: (err) =>
      Alert.alert('Could not accept request', err.message || 'Please try again.'),
  });
  const decline = useDeclineFriendRequest({
    onSettled: () => setBusy(null),
    onError: (err) =>
      Alert.alert('Could not decline request', err.message || 'Please try again.'),
  });

  const disabled = busy !== null;

  return (
    <GlassCard>
      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <Avatar
            uri={request.sender.picture ?? null}
            name={request.sender.name}
            size={40}
          />
          <View className="flex-1">
            <Text
              className="text-foreground font-sans-medium text-sm"
              numberOfLines={1}
            >
              {request.sender.name}
            </Text>
            <Text
              className="text-muted font-sans text-xs mt-0.5"
              numberOfLines={1}
            >
              {request.sender.email}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PillButton
              label="Decline"
              variant="ghost"
              size="sm"
              disabled={disabled}
              loading={busy === 'decline'}
              onPress={() => {
                setBusy('decline');
                decline.mutate({ requestId: request.id });
              }}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Accept"
              variant="primary"
              size="sm"
              disabled={disabled}
              loading={busy === 'accept'}
              onPress={() => {
                setBusy('accept');
                accept.mutate({ requestId: request.id });
              }}
            />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}
