import { Text, View } from 'react-native';

import { Amount, GlassCard } from '../../ui';

export function BalanceHero({
  netBalance,
  totalReceivable,
  totalPayable,
  spent,
}: {
  netBalance: number;
  totalReceivable: number;
  totalPayable: number;
  spent: number;
}) {
  return (
    <GlassCard variant="strong">
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        Net balance
      </Text>
      <View className="mt-2">
        <Amount value={netBalance} size="xl" tone="auto" signed />
      </View>
      <View className="mt-4 flex-row gap-6">
        <BalanceStat label="Owed to you" value={totalReceivable} tone="gain" />
        <BalanceStat label="You owe" value={totalPayable} tone="loss" />
      </View>
      <View className="mt-4 border-t border-border pt-3 flex-row items-center justify-between">
        <Text className="text-muted font-sans text-xs">Spent this month</Text>
        <Amount value={spent} size="md" tone="neutral" />
      </View>
    </GlassCard>
  );
}

function BalanceStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gain' | 'loss';
}) {
  return (
    <View className="flex-1">
      <Text className="text-muted font-sans text-xs">{label}</Text>
      <View className="mt-1">
        <Amount value={value} size="md" tone={tone} />
      </View>
    </View>
  );
}
