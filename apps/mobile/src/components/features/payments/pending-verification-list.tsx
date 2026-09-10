/**
 * Home section — payee side.
 *
 * Lists payments where the current user is the expense payee and still
 * needs to confirm receipt. Tapping "Confirm receipt" flips
 * `isVerified: true` via `useUpdatePayment`; the payment domain
 * invalidation cascades through splits + dashboard so the receivable
 * settles on the next paint without a manual refetch.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import type { PaymentWithRelations } from '@repo/shared/types/entities';

import { useUpdatePayment } from '../../../lib/api/mutations/paymentMutations';
import { useGetPendingVerification } from '../../../lib/api/queries/paymentQueries';
import { colors } from '../../../lib/theme';
import { Amount, GlassCard, PillButton } from '../../ui';

export function PendingVerificationList() {
  const query = useGetPendingVerification();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const verify = useUpdatePayment({
    onSettled: () => setPendingId(null),
    onError: (err) => {
      Alert.alert('Verification failed', err.message ?? 'Please try again.');
    },
  });

  const payments = query.data ?? [];
  if (payments.length === 0) return null;

  const onConfirm = (payment: PaymentWithRelations) => {
    Alert.alert(
      'Confirm receipt?',
      `Confirm you received ₱${payment.amountPaid.toFixed(2)} from ${
        payment.expenseSplit?.user?.name ?? 'someone'
      } via ${payment.paymentMethod === 'GCASH' ? 'GCash' : 'Cash'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setPendingId(payment.id);
            verify.mutate({
              id: payment.id,
              paymentData: { isVerified: true },
            });
          },
        },
      ],
    );
  };

  return (
    <GlassCard>
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="time-outline" size={18} color={colors.foreground} />
        <Text className="text-foreground font-sans-semibold text-base">
          Pending verification
        </Text>
        <Text className="text-muted font-sans text-xs">
          ({payments.length})
        </Text>
      </View>
      <Text className="text-muted font-sans-light text-xs mb-3">
        People paying you back. Confirm once you've seen the transfer in
        GCash or received cash.
      </Text>
      <View className="gap-3">
        {payments.map((p, i) => (
          <View
            key={p.id}
            className={`gap-3 ${i === payments.length - 1 ? '' : 'border-b border-border pb-3'}`}
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 pr-2">
                <Text
                  className="text-foreground font-sans-medium text-sm"
                  numberOfLines={1}
                >
                  {p.expenseSplit?.user?.name ?? 'Someone'} paid you back
                </Text>
                <Text
                  className="text-muted font-sans text-xs mt-0.5"
                  numberOfLines={1}
                >
                  {p.expenseSplit?.expense?.name ?? 'Expense'} ·{' '}
                  {p.paymentMethod === 'GCASH' ? 'GCash' : 'Cash'}
                </Text>
              </View>
              <Amount value={p.amountPaid} size="md" tone="gain" />
            </View>
            <PillButton
              label="Confirm receipt"
              variant="primary"
              size="sm"
              onPress={() => onConfirm(p)}
              loading={verify.isPending && pendingId === p.id}
              disabled={verify.isPending}
            />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
