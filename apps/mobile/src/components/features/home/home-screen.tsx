/**
 * Home tab — mobile mirror of web's `/home` dashboard.
 *
 * Data flows from a single `useDashboard(month)` query. Web's dashboard
 * exposes both all-time debt (payables/receivables/netBalance) and a
 * month-scoped `spent` figure + monthLabel, so a single fetch drives
 * the whole screen; the month selector just refetches with the next
 * `YYYY-MM`.
 */

import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import type { DashboardResponse } from '@repo/shared/types/entities';

import { useDashboard } from '../../../lib/api/queries/dashboardQueries';
import { ErrorState, LoadingState, Screen } from '../../ui';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import { BalanceHero } from './balance-hero';
import {
  DashboardHeader,
  currentMonthParam,
  isCurrentOrLater,
  shiftMonth,
} from './dashboard-header';
import { PayablesList } from './payables-list';
import { ReceivablesList } from './receivables-list';
import { RecentExpensesList } from './recent-expenses-list';

export function HomeScreen() {
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
          <DashboardHeader
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
      <PayablesList payables={safe.payables} />
      <ReceivablesList receivables={safe.receivables} />
      <RecentExpensesList feed={safe.recentFeed} />
    </View>
  );
}
