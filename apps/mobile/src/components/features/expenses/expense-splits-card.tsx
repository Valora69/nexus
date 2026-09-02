import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import type { ExpenseSplitWithRelations } from '@repo/shared/types/entities';
import { isSplitSettled, verifiedPaid } from '@repo/shared/utils/splits';

import { Amount, Avatar, GlassCard } from '../../ui';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';

export function ExpenseSplitsCard({
  splits,
  isLoading,
  error,
}: {
  splits: ExpenseSplitWithRelations[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <GlassCard>
      <View className="flex-row items-center gap-2">
        <Ionicons name="pie-chart-outline" size={18} color={BRAND_ACCENT_HEX} />
        <Text className="text-foreground font-sans-semibold text-base">
          Splits
        </Text>
      </View>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-3">Loading…</Text>
      ) : error ? (
        <Text className="text-loss font-sans text-sm mt-3">{error.message}</Text>
      ) : !splits || splits.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">
          No splits recorded.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {splits.map((s) => {
            const paid = verifiedPaid(s.payments);
            const settled = isSplitSettled(s);
            const remaining = Math.max(0, s.amount - paid);
            return (
              <View
                key={s.id}
                className="flex-row items-center gap-3 p-3 rounded-xl bg-card"
              >
                <Avatar name={s.user?.name ?? '?'} size={32} />
                <View className="flex-1">
                  <Text
                    className="text-foreground font-sans-medium text-sm"
                    numberOfLines={1}
                  >
                    {s.user?.name ?? 'Unknown'}
                  </Text>
                  <Text className="text-muted font-sans text-xs" numberOfLines={1}>
                    {settled
                      ? 'Settled'
                      : paid > 0
                        ? `₱${paid.toFixed(2)} paid · ₱${remaining.toFixed(2)} left`
                        : `₱${s.amount.toFixed(2)} owed`}
                  </Text>
                </View>
                <View className="items-end">
                  <Amount value={s.amount} size="sm" tone="neutral" />
                  <View
                    className={`mt-1 px-2 py-0.5 rounded-full ${
                      settled ? 'bg-gain/20' : 'bg-border/30'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-sans-semibold uppercase tracking-wider ${
                        settled ? 'text-gain' : 'text-muted'
                      }`}
                    >
                      {settled ? 'Settled' : 'Unsettled'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}
