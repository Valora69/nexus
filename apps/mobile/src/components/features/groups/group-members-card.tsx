import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import { Avatar, GlassCard, PillButton } from '../../ui';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';

export function GroupMembersCard({
  group,
  onManage,
}: {
  group: GroupWithRelations;
  onManage: () => void;
}) {
  const members = group.members ?? [];
  return (
    <GlassCard>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="people-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Members ({members.length})
          </Text>
        </View>
        <PillButton label="Manage" variant="ghost" size="sm" onPress={onManage} />
      </View>
      {members.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">No members yet.</Text>
      ) : (
        <View className="mt-3 gap-2">
          {members.map((m) => (
            <View key={m.id} className="flex-row items-center gap-3">
              <Avatar name={m.user?.name ?? '?'} size={32} />
              <View className="flex-1">
                <Text
                  className="text-foreground font-sans-medium text-sm"
                  numberOfLines={1}
                >
                  {m.user?.name ?? 'Unknown'}
                </Text>
                <Text className="text-muted font-sans text-xs" numberOfLines={1}>
                  {m.user?.email ?? ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
