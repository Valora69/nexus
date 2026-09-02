import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { colors } from '../../../lib/theme';

export function GroupHeader({
  title,
  onBack,
  onEdit,
}: {
  title: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <View className="px-6 pt-4 pb-2 flex-row items-center justify-between gap-3">
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
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit group"
        onPress={onEdit}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
      >
        <Ionicons name="create-outline" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
