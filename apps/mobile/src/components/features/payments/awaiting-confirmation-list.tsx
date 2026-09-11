/**
 * Home section — payer side.
 *
 * Lists payments the current user recorded that the payee has not yet
 * verified. Read-only: the payer can't force a verification, only nudge
 * (a nudge action is a later stage). Same pending endpoint pair as
 * `PendingVerificationList`, opposite side.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { useGetPendingConfirmation } from '../../../lib/api/queries/paymentQueries';
import { colors } from '../../../lib/theme';
import { Amount, GlassCard } from '../../ui';

export function AwaitingConfirmationList() {
  const query = useGetPendingConfirmation();
  const payments = query.data ?? [];
  if (payments.length === 0) return null;

  return (
    <GlassCard>
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons
          name="hourglass-outline"
          size={18}
          color={colors.foreground}
        />
        <Text className="text-foreground font-sans-semibold text-base">
          Awaiting confirmation
        </Text>
        <Text className="text-muted font-sans text-xs">
          ({payments.length})
        </Text>
      </View>
      <Text className="text-muted font-sans-light text-xs mb-3">
        Payments you recorded. Waiting for the payee to confirm receipt.
      </Text>
      <View className="gap-3">
        {payments.map((p, i) => (
          <View
            key={p.id}
            className={`flex-row items-center justify-between gap-3 ${
              i === payments.length - 1 ? '' : 'border-b border-border pb-3'
            }`}
          >
            <View className="flex-1 pr-2">
              <Text
                className="text-foreground font-sans-medium text-sm"
                numberOfLines={1}
              >
                Paid to{' '}
                {p.expenseSplit?.expense?.payee?.name ??
                  p.expenseSplit?.expense?.payer?.name ??
                  'someone'}
              </Text>
              <Text
                className="text-muted font-sans text-xs mt-0.5"
                numberOfLines={1}
              >
                {p.expenseSplit?.expense?.name ?? 'Expense'} ·{' '}
                {p.paymentMethod === 'GCASH' ? 'GCash' : 'Cash'}
              </Text>
            </View>
            <Amount value={p.amountPaid} size="md" tone="loss" />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
