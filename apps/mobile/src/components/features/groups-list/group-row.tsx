import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

export function GroupRow({
  group,
  onPress,
}: {
  group: GroupWithRelations;
  onPress: () => void;
}) {
  const memberCount = group.members?.length ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open group ${group.name}`}
      onPress={onPress}
      className="rounded-2xl border border-border bg-card active:bg-card-hover p-4"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Ionicons name="people-outline" size={18} color={BRAND_ACCENT_HEX} />
            <Text
              className="text-foreground font-sans-semibold text-lg"
              numberOfLines={1}
            >
              {group.name}
            </Text>
          </View>
          {group.description ? (
            <Text
              className="text-muted font-sans-light text-sm mt-1"
              numberOfLines={2}
            >
              {group.description}
            </Text>
          ) : null}
          <Text className="text-muted font-sans text-xs mt-2">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
    </Pressable>
  );
}
