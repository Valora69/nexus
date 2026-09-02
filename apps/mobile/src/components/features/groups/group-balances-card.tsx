/**
 * My balance in this group.
 *
 * Same approach as web: sum unsettled shares owed by me (payables) and
 * owed to me (receivables) using `verifiedPaid` from the shared splits
 * util. `net = receivable − payable`. Positive = they owe me.
 */

import { useMemo } from 'react';
import { Text, View } from 'react-native';

import type { ExpenseSplitWithRelations } from '@repo/shared/types/entities';
import { verifiedPaid } from '@repo/shared/utils/splits';

import { Amount, GlassCard } from '../../ui';

export function GroupBalancesCard({
  groupId,
  payables,
  receivables,
  isLoading,
}: {
  groupId: string;
  payables: ExpenseSplitWithRelations[] | undefined;
  receivables: ExpenseSplitWithRelations[] | undefined;
  isLoading: boolean;
}) {
  const { payable, receivable } = useMemo(() => {
    const payableSum = sumOutstanding(
      (payables ?? []).filter((s) => s.expense.groupId === groupId),
    );
    const receivableSum = sumOutstanding(
      (receivables ?? []).filter((s) => s.expense.groupId === groupId),
    );
    return { payable: payableSum, receivable: receivableSum };
  }, [payables, receivables, groupId]);

  const net = receivable - payable;

  return (
    <GlassCard>
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        My balance in this group
      </Text>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-2">Calculating…</Text>
      ) : (
        <>
          <View className="mt-2">
            <Amount value={net} size="xl" tone="auto" signed />
          </View>
          <View className="mt-4 flex-row gap-6">
            <BalanceStat label="Owed to you" value={receivable} tone="gain" />
            <BalanceStat label="You owe" value={payable} tone="loss" />
          </View>
        </>
      )}
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

function sumOutstanding(splits: ExpenseSplitWithRelations[]): number {
  return splits.reduce((total, split) => {
    const remaining = split.amount - verifiedPaid(split.payments);
    return remaining > 0.01 ? total + remaining : total;
  }, 0);
}
