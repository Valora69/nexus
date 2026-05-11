'use client';

import { useState } from 'react';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { useGetDashboard } from '@web/lib/client/queries/dashboardQueries';
import {
  DashboardHeader,
  BalanceCards,
  PayablesList,
  ReceivablesList,
  RecentExpensesList,
} from '@web/components/features/home';

function navigateMonth(monthParam: string, direction: 'prev' | 'next'): string {
  const parts = monthParam.split('-').map(Number);
  const year = parts[0]!;
  const month = parts[1]!;
  const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard(selectedMonth);

  const isLoading = userLoading || dashboardLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!currentUser || !dashboard) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-destructive">Please log in to view your dashboard</p>
      </div>
    );
  }

  const handlePrevMonth = () =>
    setSelectedMonth(navigateMonth(dashboard.monthParam, 'prev'));

  const handleNextMonth = () => {
    const next = navigateMonth(dashboard.monthParam, 'next');
    // Don't navigate past the current month
    const now = new Date();
    const currentMonthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (next <= currentMonthParam) setSelectedMonth(next);
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        userName={currentUser.name}
        spent={dashboard.spent}
        monthLabel={dashboard.monthLabel}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isCurrentMonth={dashboard.monthParam === (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        })()}
      />

      <BalanceCards
        balances={{
          netBalance: dashboard.netBalance,
          totalReceivable: dashboard.totalReceivable,
          totalPayable: dashboard.totalPayable,
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PayablesList payables={dashboard.payables} />
        <ReceivablesList receivables={dashboard.receivables} />
      </div>

      <RecentExpensesList feed={dashboard.recentFeed} />
    </div>
  );
}
