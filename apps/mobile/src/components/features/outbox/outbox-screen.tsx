/**
 * Outbox screen container: renders every queued or failed write the
 * current user has locally, with retry / discard controls.
 *
 * A note on the payload preview: we intentionally show the intent
 * (expense name + amount, or payment amount) rather than a raw JSON
 * dump. Users need to answer "what is stuck?" — not "what does the
 * mobile client send to the server?"
 */

import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import type {
  CreateExpenseData,
  CreatePaymentData,
} from '@repo/shared/types/request';

import {
  deleteRow,
  requestDrain,
  retryRow,
  useOutboxRows,
  type OutboxRow,
} from '../../../lib/offline';
import { colors } from '../../../lib/theme';
import { EmptyState, PillButton, Screen } from '../../ui';

export function OutboxScreen() {
  const router = useRouter();
  const rows = useOutboxRows();

  const sorted = useMemo(
    () =>
      // Failed first (they need attention), then pending in FIFO order.
      [...rows].sort((a, b) => {
        if (a.status === b.status) return a.createdAt - b.createdAt;
        if (a.status === 'failed') return -1;
        if (b.status === 'failed') return 1;
        return a.createdAt - b.createdAt;
      }),
    [rows],
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <Header title="Sync queue" onClose={() => router.back()} />
      {sorted.length === 0 ? (
        <EmptyState
          title="Nothing to sync"
          description="Every offline write has landed on the server."
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {sorted.map((row) => (
            <OutboxRowCard key={row.id} row={row} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function OutboxRowCard({ row }: { row: OutboxRow }) {
  const summary = summarize(row);
  const isFailed = row.status === 'failed';
  const dot = isFailed
    ? 'bg-loss'
    : row.status === 'syncing'
      ? 'bg-accent'
      : 'bg-muted';

  return (
    <View className="bg-surface/60 border border-border rounded-2xl p-4 gap-3">
      <View className="flex-row items-start gap-3">
        <View className={`${dot} rounded-full`} style={{ width: 8, height: 8, marginTop: 6 }} />
        <View className="flex-1">
          <Text className="text-foreground font-medium">{summary.title}</Text>
          <Text className="text-muted text-xs mt-0.5">{summary.subtitle}</Text>
          {row.retryCount > 0 && (
            <Text className="text-muted text-xs mt-1">
              Attempts: {row.retryCount}
            </Text>
          )}
          {row.lastError && (
            <Text className="text-loss text-xs mt-1">{row.lastError}</Text>
          )}
        </View>
      </View>
      <View className="flex-row gap-2">
        {isFailed && (
          <PillButton
            label="Retry"
            variant="secondary"
            size="sm"
            onPress={async () => {
              await retryRow(row.id);
              requestDrain();
            }}
          />
        )}
        <PillButton
          label="Discard"
          variant="ghost"
          size="sm"
          onPress={() =>
            Alert.alert(
              'Discard this write?',
              'The change will not be sent to the server. This cannot be undone.',
              [
                { text: 'Keep', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                    void deleteRow(row.id);
                  },
                },
              ],
            )
          }
        />
      </View>
    </View>
  );
}

function summarize(row: OutboxRow): { title: string; subtitle: string } {
  const status =
    row.status === 'failed'
      ? 'Failed'
      : row.status === 'syncing'
        ? 'Syncing…'
        : 'Pending';
  if (row.type === 'expense.create') {
    const p = row.payload as Partial<CreateExpenseData>;
    return {
      title: p.name?.trim() || 'New expense',
      subtitle: `${status} · Expense · ₱${(p.totalAmount ?? 0).toFixed(2)}`,
    };
  }
  if (row.type === 'payment.create') {
    const p = row.payload as Partial<CreatePaymentData>;
    return {
      title: `Payment ${p.paymentMethod ?? ''}`.trim(),
      subtitle: `${status} · Payment · ₱${(p.amountPaid ?? 0).toFixed(2)}`,
    };
  }
  return { title: 'Queued write', subtitle: status };
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 border-b border-border"
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
      >
        <Text style={{ color: colors.accent }} className="text-sm">
          Close
        </Text>
      </Pressable>
      <Text className="text-foreground text-base font-semibold">{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
