/**
 * Record-payment screen — mobile mirror of web's `PaySplitModal`.
 *
 * Presented as a modal from Expo Router with a query-param `splitId`.
 * The split is resolved from the cached `useMyPayables()` list (the
 * user always arrives here from a payable they own) instead of a fresh
 * per-split fetch — same data the entry point renders, no roundtrip.
 *
 * Submit hits `/api/payment` via `useCreatePayment` with an outbox-ready
 * `clientRequestId` (stage 12 will replace with an outbox-owned id).
 * Amount is capped by remaining unclaimed — same 1-cent tolerance the
 * server uses in its `SELECT … FOR UPDATE`-guarded remaining check.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import type { ExpenseSplitWithRelations } from '@repo/shared/types/entities';

import { ApiError } from '../../../lib/api/client';
import { useCreatePayment } from '../../../lib/api/mutations/paymentMutations';
import { useMyPayables } from '../../../lib/api/queries/expenseSplitQueries';
import { colors } from '../../../lib/theme';
import {
  ErrorState,
  LoadingState,
  PillButton,
  Screen,
  TextField,
} from '../../ui';

type Method = 'GCASH' | 'CASH';

export function RecordPaymentScreen({ splitId }: { splitId: string | undefined }) {
  const router = useRouter();
  const payablesQuery = useMyPayables();

  const split = useMemo(
    () => payablesQuery.data?.find((s) => s.id === splitId),
    [payablesQuery.data, splitId],
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <Header title="Record payment" onClose={() => router.back()} />
      {!splitId ? (
        <ErrorState
          title="No split selected"
          error={new Error('Open this screen from a payable share.')}
        />
      ) : payablesQuery.isLoading ? (
        <LoadingState />
      ) : payablesQuery.isError ? (
        <ErrorState
          error={payablesQuery.error}
          onRetry={() => payablesQuery.refetch()}
        />
      ) : !split ? (
        <ErrorState
          title="Share not found"
          error={new Error('This share is settled or no longer owed by you.')}
        />
      ) : (
        <RecordPaymentForm split={split} onDone={() => router.back()} />
      )}
    </Screen>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View className="px-6 pt-4 pb-2 flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
      >
        <Ionicons name="close" size={20} color={colors.foreground} />
      </Pressable>
      <Text className="flex-1 text-foreground font-sans-bold text-xl">
        {title}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function RecordPaymentForm({
  split,
  onDone,
}: {
  split: ExpenseSplitWithRelations;
  onDone: () => void;
}) {
  // `claimed` counts every payment (verified + pending) so users don't
  // over-claim while a prior payment is still awaiting the payee's
  // confirmation. Matches web's client-side guard and the server's
  // remaining-balance check.
  const claimed = useMemo(
    () => (split.payments ?? []).reduce((s, p) => s + p.amountPaid, 0),
    [split.payments],
  );
  const remaining = Math.max(0, split.amount - claimed);

  const [method, setMethod] = useState<Method>('GCASH');
  const [amount, setAmount] = useState(() => remaining.toFixed(2));
  const [error, setError] = useState<string | null>(null);

  // If the cache updates mid-view (e.g. background refetch after a
  // sibling payment landed), keep the amount default in sync unless the
  // user has diverged from the previous default.
  useEffect(() => {
    setAmount(remaining.toFixed(2));
  }, [remaining]);

  const payeeGcash = split.expense.payee?.gcashNumber;
  const payeeName = split.expense.payee?.name ?? 'the payee';

  const createMutation = useCreatePayment({
    onSuccess: (result) => {
      if (result.kind === 'queued') {
        Alert.alert(
          'Queued for sync',
          "This payment will send as soon as you're back online. Ask the recipient to verify it once it appears.",
        );
      }
      onDone();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to record payment';
      setError(message);
    },
  });

  const parsed = parseFloat(amount || '0');
  const amountValid =
    !Number.isNaN(parsed) && parsed > 0 && parsed <= remaining + 0.01;
  const gcashReady = method === 'CASH' || !!payeeGcash;
  const canSubmit = amountValid && gcashReady && !createMutation.isPending;

  const submit = () => {
    setError(null);
    if (!amountValid) {
      setError(`Enter an amount up to ₱${remaining.toFixed(2)}.`);
      return;
    }
    if (!gcashReady) {
      setError(`${payeeName} has not set up their GCash number yet.`);
      return;
    }
    createMutation.mutate({
      paymentData: {
        expenseSplitId: split.id,
        amountPaid: parsed,
        paymentMethod: method,
      },
      clientRequestId: Crypto.randomUUID(),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <SharePanel
        expenseName={split.expense.name}
        share={split.amount}
        claimed={claimed}
        remaining={remaining}
      />

      <TextField
        label="Amount to pay"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        helper={`Up to ₱${remaining.toFixed(2)} remaining`}
      />

      <MethodPicker value={method} onChange={setMethod} />

      {method === 'GCASH' ? (
        <GcashPanel
          name={payeeName}
          number={payeeGcash}
          onCopy={async () => {
            if (payeeGcash) {
              await Clipboard.setStringAsync(payeeGcash);
            }
          }}
        />
      ) : (
        <CashPanel name={payeeName} />
      )}

      <PendingHint payeeName={payeeName} />

      {error ? (
        <Text className="text-loss font-sans text-sm">{error}</Text>
      ) : null}

      <PillButton
        label="I've paid"
        variant="primary"
        onPress={() => {
          if (!canSubmit) return;
          Alert.alert(
            'Record payment?',
            `You paid ₱${parsed.toFixed(2)} to ${payeeName} via ${method === 'GCASH' ? 'GCash' : 'Cash'}.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Record', onPress: submit },
            ],
          );
        }}
        loading={createMutation.isPending}
        disabled={!canSubmit}
      />
    </ScrollView>
  );
}

function SharePanel({
  expenseName,
  share,
  claimed,
  remaining,
}: {
  expenseName: string;
  share: number;
  claimed: number;
  remaining: number;
}) {
  const hasPartial = claimed > 0.01;
  return (
    <View className="items-center gap-1 py-2">
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        Your share
      </Text>
      <Text className="text-foreground font-mono-bold text-3xl tabular-nums">
        ₱{share.toFixed(2)}
      </Text>
      <Text className="text-muted font-sans text-sm">{expenseName}</Text>
      {hasPartial ? (
        <Text className="text-muted font-sans-light text-xs mt-1">
          Paid ₱{claimed.toFixed(2)} · Remaining ₱{remaining.toFixed(2)}
        </Text>
      ) : null}
    </View>
  );
}

function MethodPicker({
  value,
  onChange,
}: {
  value: Method;
  onChange: (m: Method) => void;
}) {
  return (
    <View className="flex-row gap-3">
      <MethodTile
        label="GCash"
        sub="Instant transfer"
        icon="phone-portrait-outline"
        active={value === 'GCASH'}
        onPress={() => onChange('GCASH')}
      />
      <MethodTile
        label="Cash"
        sub="Hand-to-hand"
        icon="cash-outline"
        active={value === 'CASH'}
        onPress={() => onChange('CASH')}
      />
    </View>
  );
}

function MethodTile({
  label,
  sub,
  icon,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`flex-1 items-center gap-2 p-4 rounded-2xl border ${
        active ? 'border-accent bg-accent/10' : 'border-border bg-card'
      } active:opacity-80`}
    >
      <Ionicons
        name={icon}
        size={26}
        color={active ? colors.accent : colors.foreground}
      />
      <Text className="text-foreground font-sans-semibold text-sm">
        {label}
      </Text>
      <Text className="text-muted font-sans text-xs">{sub}</Text>
    </Pressable>
  );
}

function GcashPanel({
  name,
  number,
  onCopy,
}: {
  name: string;
  number: string | undefined;
  onCopy: () => Promise<void>;
}) {
  if (!number) {
    return (
      <View className="p-4 rounded-2xl border border-loss/40 bg-loss/10">
        <Text className="text-loss font-sans text-sm">
          {name} has not set up their GCash number yet. Ask them to update
          their profile or choose Cash instead.
        </Text>
      </View>
    );
  }
  return (
    <View className="p-4 rounded-2xl border border-border bg-card gap-3">
      <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
        GCash payment details
      </Text>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-muted font-sans text-xs">Send to</Text>
          <Text className="text-foreground font-mono-bold text-lg tabular-nums">
            {number}
          </Text>
          <Text className="text-muted font-sans text-xs mt-0.5">{name}</Text>
        </View>
        <PillButton
          label="Copy"
          variant="secondary"
          size="sm"
          onPress={() => {
            void onCopy();
          }}
        />
      </View>
      <Text className="text-muted font-sans-light text-xs">
        Copy the number, complete the transfer in GCash, then tap "I've paid".
      </Text>
    </View>
  );
}

function CashPanel({ name }: { name: string }) {
  return (
    <View className="p-4 rounded-2xl border border-border bg-card">
      <Text className="text-foreground font-sans-medium text-sm mb-1">
        Cash payment
      </Text>
      <Text className="text-muted font-sans text-xs">
        Hand the cash to {name}, then tap "I've paid" below. They will
        confirm receipt from their end.
      </Text>
    </View>
  );
}

function PendingHint({ payeeName }: { payeeName: string }) {
  return (
    <View className="flex-row items-start gap-2 p-3 rounded-2xl border border-border bg-card">
      <Ionicons name="time-outline" size={16} color={colors.muted} />
      <Text className="flex-1 text-muted font-sans-light text-xs">
        Payment will stay pending until {payeeName} verifies it.
      </Text>
    </View>
  );
}
