'use client';

import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { useGetDashboard } from '@web/lib/client/queries/dashboardQueries';
import {
  DashboardHeader,
  BalanceCards,
  PayablesList,
  ReceivablesList,
  RecentExpensesList,
  DashboardSkeleton,
} from '@web/components/features/home';

export default function Dashboard() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard(
    undefined,
    !!currentUser,
  );

  if (userLoading || dashboardLoading) {
    return <DashboardSkeleton />;
  }

  const safeDashboard = dashboard ?? {
    netBalance: 0,
    totalReceivable: 0,
    totalPayable: 0,
    payables: [],
    receivables: [],
    recentFeed: [],
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader />

      <BalanceCards
        balances={{
          netBalance: safeDashboard.netBalance,
          totalReceivable: safeDashboard.totalReceivable,
          totalPayable: safeDashboard.totalPayable,
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PayablesList payables={safeDashboard.payables} />
        <ReceivablesList receivables={safeDashboard.receivables} />
      </div>

      <RecentExpensesList feed={safeDashboard.recentFeed} />
    </div>
  );
}
