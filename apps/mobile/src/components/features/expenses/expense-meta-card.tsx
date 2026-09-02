import { Text, View } from 'react-native';

import type { ExpenseWithRelations } from '@repo/shared/types/entities';
import { formatDateTime } from '@repo/shared/utils/formatters';

import { GlassCard } from '../../ui';

export function ExpenseMetaCard({ expense }: { expense: ExpenseWithRelations }) {
  return (
    <GlassCard>
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        Metadata
      </Text>
      <View className="mt-2 gap-1">
        <Text className="text-muted font-sans text-xs">
          Created {formatDateTime(expense.createdAt)}
        </Text>
        <Text className="text-muted font-sans text-xs">
          Updated {formatDateTime(expense.updatedAt)}
        </Text>
      </View>
    </GlassCard>
  );
}
