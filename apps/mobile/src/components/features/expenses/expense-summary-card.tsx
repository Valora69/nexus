import { Text, View } from 'react-native';

import type { ExpenseWithRelations } from '@repo/shared/types/entities';
import { formatDate } from '@repo/shared/utils/formatters';

import { Amount, GlassCard } from '../../ui';

export function ExpenseSummaryCard({ expense }: { expense: ExpenseWithRelations }) {
  const paidBy = expense.payee?.name ?? expense.payer?.name ?? 'Unknown';
  return (
    <GlassCard variant="strong">
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        {expense.group?.name ?? 'Expense'}
      </Text>
      <Text className="text-foreground font-sans-bold text-2xl mt-1">
        {expense.name}
      </Text>
      <View className="mt-2">
        <Amount value={expense.totalAmount} size="xl" tone="neutral" />
      </View>
      <Text className="text-muted font-sans text-sm mt-2">
        Paid by <Text className="text-accent">{paidBy}</Text> ·{' '}
        {formatDate(expense.date)}
      </Text>
      {expense.notes ? (
        <Text className="text-foreground font-sans-light text-sm mt-3">
          {expense.notes}
        </Text>
      ) : null}
    </GlassCard>
  );
}
