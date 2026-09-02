import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import type { ExpenseWithRelations } from '@repo/shared/types/entities';
import { formatDateShort } from '@repo/shared/utils/formatters';

import { Amount, GlassCard, PillButton } from '../../ui';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';

export function GroupExpensesList({
  expenses,
  isLoading,
  error,
  onAdd,
  onOpen,
}: {
  expenses: ExpenseWithRelations[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onAdd: () => void;
  onOpen: (expenseId: string) => void;
}) {
  return (
    <GlassCard>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Expenses ({expenses?.length ?? 0})
          </Text>
        </View>
        <PillButton label="Add" variant="primary" size="sm" onPress={onAdd} />
      </View>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-3">Loading…</Text>
      ) : error ? (
        <Text className="text-loss font-sans text-sm mt-3">{error.message}</Text>
      ) : !expenses || expenses.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">
          No expenses yet. Tap Add to record one.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {expenses.map((expense) => {
            const paidBy = expense.payee?.name ?? expense.payer?.name ?? 'Unknown';
            const splitCount = expense.splits?.length ?? 0;
            return (
              <Pressable
                key={expense.id}
                accessibilityRole="button"
                accessibilityLabel={`Open expense ${expense.name}`}
                onPress={() => onOpen(expense.id)}
                className="flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card active:bg-card-hover"
              >
                <View className="flex-1">
                  <Text
                    className="text-foreground font-sans-medium text-sm"
                    numberOfLines={1}
                  >
                    {expense.name}
                  </Text>
                  <Text
                    className="text-muted font-sans text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {paidBy} · {formatDateShort(expense.date)}
                    {splitCount > 0 ? ` · ${splitCount} splits` : ''}
                  </Text>
                </View>
                <Amount value={expense.totalAmount} size="sm" tone="neutral" />
              </Pressable>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}
