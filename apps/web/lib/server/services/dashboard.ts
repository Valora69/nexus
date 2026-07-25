import { prisma } from '@/lib/server/db';
import { PersonalTransactionType } from '@prisma/client';

function parseMonth(month?: string): {
  startDate: Date;
  endDate: Date;
  monthLabel: string;
  monthParam: string;
} {
  let year: number;
  let monthIndex: number;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parts = month.split('-').map(Number);
    year = parts[0]!;
    monthIndex = parts[1]! - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    monthIndex = now.getMonth();
  }
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 1);
  const monthLabel = startDate.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthParam = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  return { startDate, endDate, monthLabel, monthParam };
}

export async function getDashboard(userId: string, month?: string) {
  const { startDate, endDate, monthLabel, monthParam } = parseMonth(month);

  const settled = await Promise.allSettled([
    // 0 - payableSplits
    prisma.expenseSplit.findMany({
      where: {
        userId,
        expense: {
          payeeId: { not: null },
          NOT: { payeeId: userId },
        },
      },
      include: {
        expense: {
          include: {
            payee: { select: { id: true, name: true } },
            group: { select: { id: true, name: true } },
          },
        },
        payments: {
          where: { isVerified: true },
          select: { amountPaid: true },
        },
      },
    }),
    // 1 - receivableSplits
    prisma.expenseSplit.findMany({
      where: {
        userId: { not: userId },
        expense: { payeeId: userId },
      },
      include: {
        user: { select: { id: true, name: true } },
        expense: {
          include: {
            group: { select: { id: true, name: true } },
          },
        },
        payments: {
          where: { isVerified: true },
          select: { amountPaid: true },
        },
      },
    }),
    // 2 - spentAggregate
    prisma.personalTransaction.aggregate({
      where: {
        userId,
        type: PersonalTransactionType.EXPENSE,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    }),
    // 3 - recentFeed
    prisma.personalTransaction.findMany({
      where: { userId },
      include: {
        expenseSplit: {
          include: {
            expense: {
              include: {
                group: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    // 4 - allTimeCreditAggregate
    prisma.personalTransaction.aggregate({
      where: {
        userId,
        type: PersonalTransactionType.CREDIT,
      },
      _sum: { amount: true },
    }),
    // 5 - allTimeExpenseAggregate
    prisma.personalTransaction.aggregate({
      where: {
        userId,
        type: PersonalTransactionType.EXPENSE,
      },
      _sum: { amount: true },
    }),
  ]);

  const unwrap = <T>(idx: number, fallback: T, label: string): T => {
    const r = settled[idx];
    if (r && r.status === 'fulfilled') return r.value as T;
    console.error(
      `Dashboard section "${label}" failed`,
      r && r.status === 'rejected' ? r.reason : 'unknown',
    );
    return fallback;
  };

  type PayableSplit = {
    amount: number;
    expense: {
      payee: { id: string; name: string } | null;
      group: { id: string; name: string };
    };
    payments: { amountPaid: number }[];
  };

  type ReceivableSplit = {
    amount: number;
    user: { id: string; name: string } | null;
    expense: {
      group: { id: string; name: string };
    };
    payments: { amountPaid: number }[];
  };

  type AggResult = { _sum: { amount: number | null } };

  type FeedItem = {
    id: string;
    type: PersonalTransactionType;
    amount: number;
    description: string | null;
    category: string | null;
    source: string | null;
    isFromGroup: boolean;
    date: Date;
    expenseSplit: {
      expense: {
        group: { id: string; name: string };
      };
    } | null;
  };

  const payableSplits = unwrap<PayableSplit[]>(0, [], 'payableSplits');
  const receivableSplits = unwrap<ReceivableSplit[]>(1, [], 'receivableSplits');
  const spentAggregate = unwrap<AggResult>(
    2,
    { _sum: { amount: null } },
    'spentAggregate',
  );
  const recentFeedRaw = unwrap<FeedItem[]>(3, [], 'recentFeed');
  const allTimeCreditAggregate = unwrap<AggResult>(
    4,
    { _sum: { amount: null } },
    'allTimeCreditAggregate',
  );
  const allTimeExpenseAggregate = unwrap<AggResult>(
    5,
    { _sum: { amount: null } },
    'allTimeExpenseAggregate',
  );

  // Debt calculations — split.amount (the user's share) minus verified payments.
  const payables = payableSplits
    .map((s) => {
      const paid = s.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      return {
        to: s.expense.payee?.name ?? 'Unknown',
        amount: Math.max(0, s.amount - paid),
        group: s.expense.group.name,
      };
    })
    .filter((p) => p.amount > 0.01);

  const receivables = receivableSplits
    .map((s) => {
      const paid = s.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      return {
        from: s.user?.name ?? 'Unknown',
        amount: Math.max(0, s.amount - paid),
        group: s.expense.group.name,
      };
    })
    .filter((r) => r.amount > 0.01);

  const totalPayable = payables.reduce((sum, p) => sum + p.amount, 0);
  const totalReceivable = receivables.reduce((sum, r) => sum + r.amount, 0);
  // Net balance = all-time credits minus all-time expenses across personal transactions.
  const netBalance =
    (allTimeCreditAggregate._sum.amount ?? 0) -
    (allTimeExpenseAggregate._sum.amount ?? 0);

  // Recent activity feed
  const recentFeed = recentFeedRaw.map((item) => ({
    id: item.id,
    label:
      item.description ??
      (item.type === PersonalTransactionType.CREDIT ? 'Cash in' : 'Expense'),
    sublabel: item.isFromGroup
      ? `Group: ${item.expenseSplit?.expense?.group?.name ?? 'Unknown'}`
      : [item.category, item.source].filter(Boolean).join(' · '),
    amount: item.amount,
    date: item.date.toISOString(),
    isCredit: item.type === PersonalTransactionType.CREDIT,
    isFromGroup: item.isFromGroup,
  }));

  return {
    // Debt tracking — all-time, not month-filtered
    netBalance,
    totalReceivable,
    totalPayable,
    payables,
    receivables,
    // Monthly spending
    spent: spentAggregate._sum.amount ?? 0,
    monthLabel,
    monthParam,
    // Unified recent activity
    recentFeed,
  };
}
