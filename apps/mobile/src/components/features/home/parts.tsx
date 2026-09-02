import { Text, View } from 'react-native';

import { Amount } from '../../ui';

export function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-foreground font-sans-semibold text-base">{title}</Text>
      {count > 0 ? (
        <Text className="text-muted font-sans text-xs">
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return (
    <View className="py-6 items-center">
      <Text className="text-muted font-sans-light text-sm">{message}</Text>
    </View>
  );
}

export function PartyRow({
  primary,
  secondary,
  amount,
  tone,
  isLast,
}: {
  primary: string;
  secondary: string;
  amount: number;
  tone: 'gain' | 'loss';
  isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between ${isLast ? '' : 'border-b border-border pb-3'}`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-foreground font-sans-medium text-sm" numberOfLines={1}>
          {primary}
        </Text>
        <Text className="text-muted font-sans text-xs mt-0.5" numberOfLines={1}>
          {secondary}
        </Text>
      </View>
      <Amount value={amount} size="md" tone={tone} />
    </View>
  );
}
