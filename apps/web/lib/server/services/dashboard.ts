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
            payee: { select: { name: true } },
            group: { select: { name: true } },
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
        user: { select: { name: true } },
        expense: {
          include: {
            group: { select: { name: true } },
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
                group: true,
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
      payee: { name: string } | null;
      group: { name: string };
    };
    payments: { amountPaid: number }[];
  };

  type ReceivableSplit = {
    amount: number;
    user: { name: string };
    expense: {
      group: { name: string };
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

  // Calculate payables
  const payables = payableSplits
    .map((s) => {
      const verifiedPaid = s.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      return {
        amount: s.amount,
        verifiedPaid,
        remaining: s.amount - verifiedPaid,
        payeeName: s.expense.payee?.name ?? 'Unknown',
        groupName: s.expense.group.name,
      };
    })
    .filter((p) => p.remaining > 0.01);

  // Calculate receivables
  const receivables = receivableSplits
    .map((s) => {
      const verifiedPaid = s.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      return {
        amount: s.amount,
        verifiedPaid,
        remaining: s.amount - verifiedPaid,
        userName: s.user.name,
        groupName: s.expense.group.name,
      };
    })
    .filter((r) => r.remaining > 0.01);

  const totalPayable = payables.reduce((sum, p) => sum + p.remaining, 0);
  const totalReceivable = receivables.reduce((sum, r) => sum + r.remaining, 0);
  const netBalance = totalReceivable - totalPayable;

  // Build recent feed
  const recentFeed = recentFeedRaw.map((item) => ({
    id: item.id,
    label: item.description ?? item.category ?? item.source ?? 'Transaction',
    sublabel: item.isFromGroup
      ? (item.expenseSplit?.expense?.group?.name ?? 'Group')
      : (item.category ?? item.source ?? null),
    amount: item.amount,
    date: item.date,
    isCredit: item.type === PersonalTransactionType.CREDIT,
    isFromGroup: item.isFromGroup,
  }));

  return {
    monthLabel,
    monthParam,
    spentThisMonth: spentAggregate._sum.amount ?? 0,
    allTimeCredits: allTimeCreditAggregate._sum.amount ?? 0,
    allTimeExpenses: allTimeExpenseAggregate._sum.amount ?? 0,
    payables,
    receivables,
    totalPayable,
    totalReceivable,
    netBalance,
    recentFeed,
  };
}
