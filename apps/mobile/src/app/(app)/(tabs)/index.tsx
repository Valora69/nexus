/**
 * Home tab — mobile mirror of web's `/home` dashboard.
 *
 * Data flows from a single `useDashboard(month)` query. Web's dashboard
 * exposes both all-time debt (payables/receivables/netBalance) and a
 * month-scoped `spent` figure + monthLabel, so a single fetch drives
 * the whole screen; the month selector just refetches with the next
 * `YYYY-MM`.
 *
 * Layout follows the web dashboard top-to-bottom:
 *   month header → net-balance hero → receivables / payables →
 *   month spend line → recent activity feed
 *
 * Native affordances layered on:
 *   - RefreshControl (pull-to-refresh)
 *   - LoadingState / ErrorState / EmptyState split from web's Skeleton
 *   - Everything wrapped in a ScrollView so short screens still scroll
 *     into the tab-bar safe area.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { formatDate } from '@repo/shared/utils/formatters';
import type {
  DashboardResponse,
  FeedItem,
  PayableItem,
  ReceivableItem,
} from '@repo/shared/types/entities';

import { useDashboard } from '../../../lib/api/queries/dashboardQueries';
import {
  Amount,
  ErrorState,
  GlassCard,
  LoadingState,
  Screen,
} from '../../../components/ui';
import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

/** Current month in `YYYY-MM`, matching the server's `parseMonth` default. */
function currentMonthParam(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Shift a `YYYY-MM` param by ±N months. */
function shiftMonth(param: string, delta: number): string {
  const [yearStr, monthStr] = param.split('-');
  const base = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

/** Prevent forward navigation past the current month. */
function isCurrentOrLater(param: string): boolean {
  return param >= currentMonthParam();
}

export default function HomeScreen() {
  const [month, setMonth] = useState<string>(() => currentMonthParam());
  const dashboard = useDashboard(month);

  const monthLabel = useMemo(() => {
    if (dashboard.data?.monthLabel) return dashboard.data.monthLabel;
    const [yearStr, monthStr] = month.split('-');
    const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [dashboard.data?.monthLabel, month]);

  const atCurrentMonth = isCurrentOrLater(month);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isFetching && !dashboard.isLoading}
            onRefresh={() => dashboard.refetch()}
            tintColor={BRAND_ACCENT_HEX}
            colors={[BRAND_ACCENT_HEX]}
          />
        }
      >
        <View className="px-6 pt-6 gap-6">
          <MonthHeader
            label={monthLabel}
            onPrev={() => setMonth((m) => shiftMonth(m, -1))}
            onNext={() => setMonth((m) => shiftMonth(m, 1))}
            nextDisabled={atCurrentMonth}
          />

          {dashboard.isLoading ? (
            <View className="min-h-[420px]">
              <LoadingState />
            </View>
          ) : dashboard.isError ? (
            <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
          ) : (
            <DashboardBody data={dashboard.data} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function MonthHeader({
  label,
  onPrev,
  onNext,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <MonthArrow direction="prev" onPress={onPrev} disabled={false} />
      <Text className="text-foreground font-sans-bold text-2xl">{label}</Text>
      <MonthArrow direction="next" onPress={onNext} disabled={nextDisabled} />
    </View>
  );
}

function MonthArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'prev' | 'next';
  onPress: () => void;
  disabled: boolean;
}) {
  const iconName = direction === 'prev' ? 'chevron-back' : 'chevron-forward';
  const label = direction === 'prev' ? 'Previous month' : 'Next month';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      className={`h-10 w-10 items-center justify-center rounded-full border border-border ${
        disabled ? 'opacity-30' : 'active:bg-card'
      }`}
    >
      <Ionicons name={iconName} size={20} color={colors.foreground} />
    </Pressable>
  );
}

function DashboardBody({ data }: { data: DashboardResponse | undefined }) {
  const safe: DashboardResponse = data ?? {
    netBalance: 0,
    totalReceivable: 0,
    totalPayable: 0,
    payables: [],
    receivables: [],
    spent: 0,
    monthLabel: '',
    monthParam: '',
    recentFeed: [],
  };

  return (
    <View className="gap-6">
      <BalanceHero
        netBalance={safe.netBalance}
        totalReceivable={safe.totalReceivable}
        totalPayable={safe.totalPayable}
        spent={safe.spent}
      />
      <PayablesCard payables={safe.payables} />
      <ReceivablesCard receivables={safe.receivables} />
      <RecentFeedCard feed={safe.recentFeed} />
    </View>
  );
}

function BalanceHero({
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

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-foreground font-sans-semibold text-base">{title}</Text>
      {count > 0 ? (
        <Text className="text-muted font-sans text-xs">
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      ) : null}
    </View>
  );
}

function PayablesCard({ payables }: { payables: PayableItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Payables" count={payables.length} />
      {payables.length === 0 ? (
        <EmptyRow message="No outstanding payables" />
      ) : (
        <View className="gap-3">
          {payables.map((p, i) => (
            <PartyRow
              key={`${p.to}-${p.group}-${i}`}
              primary={p.to}
              secondary={p.group}
              amount={p.amount}
              tone="loss"
              isLast={i === payables.length - 1}
            />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function ReceivablesCard({ receivables }: { receivables: ReceivableItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Receivables" count={receivables.length} />
      {receivables.length === 0 ? (
        <EmptyRow message="No outstanding receivables" />
      ) : (
        <View className="gap-3">
          {receivables.map((r, i) => (
            <PartyRow
              key={`${r.from}-${r.group}-${i}`}
              primary={r.from}
              secondary={r.group}
              amount={r.amount}
              tone="gain"
              isLast={i === receivables.length - 1}
            />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function PartyRow({
  primary,
  secondary,
  amount,
  tone,
  isLast,
}: {
  primary: string;
  secondary: string;
  amount: number;
  tone: 'gain' | 'loss';
  isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between ${isLast ? '' : 'border-b border-border pb-3'}`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-foreground font-sans-medium text-sm" numberOfLines={1}>
          {primary}
        </Text>
        <Text className="text-muted font-sans text-xs mt-0.5" numberOfLines={1}>
          {secondary}
        </Text>
      </View>
      <Amount value={amount} size="md" tone={tone} />
    </View>
  );
}

function RecentFeedCard({ feed }: { feed: FeedItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Recent activity" count={feed.length} />
      {feed.length === 0 ? (
        <EmptyRow message="No activity this month" />
      ) : (
        <View className="gap-3">
          {feed.map((item, i) => (
            <FeedRow key={item.id} item={item} isLast={i === feed.length - 1} />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function FeedRow({ item, isLast }: { item: FeedItem; isLast: boolean }) {
  const iconName = item.isCredit ? 'arrow-up-outline' : 'arrow-down-outline';
  const iconColor = item.isCredit ? colors.gain : colors.loss;
  const signedAmount = item.isCredit ? item.amount : -item.amount;
  return (
    <View
      className={`flex-row items-center gap-3 ${isLast ? '' : 'border-b border-border pb-3'}`}
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-card border border-border">
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View className="flex-1 pr-3">
        <Text className="text-foreground font-sans-medium text-sm" numberOfLines={1}>
          {item.label}
        </Text>
        <Text className="text-muted font-sans text-xs mt-0.5" numberOfLines={1}>
          {item.sublabel ? `${item.sublabel} · ` : ''}
          {formatDate(item.date)}
        </Text>
      </View>
      <Amount value={signedAmount} size="md" tone="auto" signed />
    </View>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <View className="py-6 items-center">
      <Text className="text-muted font-sans-light text-sm">{message}</Text>
    </View>
  );
}

