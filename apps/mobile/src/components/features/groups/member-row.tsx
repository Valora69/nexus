import { Text, View } from 'react-native';

import { Avatar, PillButton } from '../../ui';
import type { RemovalBlocker } from '../../../lib/api/services/groupMemberService';

export type MemberLike = {
  id: string;
  user?: { id?: string; name?: string; email?: string } | null;
};

export function MemberRow({
  member,
  isMe,
  isPending,
  blockers,
  onRemove,
}: {
  member: MemberLike;
  isMe: boolean;
  isPending: boolean;
  blockers: RemovalBlocker[] | undefined;
  onRemove: () => void;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        <Avatar name={member.user?.name ?? '?'} size={40} />
        <View className="flex-1">
          <Text
            className="text-foreground font-sans-medium text-sm"
            numberOfLines={1}
          >
            {member.user?.name ?? 'Unknown'}
            {isMe ? (
              <Text className="text-muted font-sans text-xs"> (you)</Text>
            ) : null}
          </Text>
          <Text className="text-muted font-sans text-xs" numberOfLines={1}>
            {member.user?.email ?? ''}
          </Text>
        </View>
        {isMe ? null : (
          <PillButton
            label="Remove"
            variant="ghost"
            size="sm"
            loading={isPending}
            disabled={isPending}
            onPress={onRemove}
          />
        )}
      </View>
      {blockers && blockers.length > 0 ? (
        <View className="rounded-xl border border-loss/40 bg-loss/10 p-3 gap-1">
          <Text className="text-loss font-sans-semibold text-xs uppercase tracking-wider">
            Cannot remove — unsettled balances
          </Text>
          {blockers.map((b, i) => (
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
}
