import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonalTransactionType } from '@prisma/client';

const USER_SELECT = { id: true, name: true } as const;

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
    monthIndex = parts[1]! - 1; // convert to 0-indexed
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

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name, {
    timestamp: true,
  });

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, month?: string) {
    this.logger.log(`Dashboard request for user ${userId}, month: ${month ?? 'current'}`);

    const { startDate, endDate, monthLabel, monthParam } = parseMonth(month);

    // allSettled so one failing widget doesn't blank the whole dashboard.
    // Each section degrades to an empty/zero default instead of throwing.
    const settled = await Promise.allSettled([
      // Splits the user owes — participant in the split, payee is someone else
      this.prisma.expenseSplit.findMany({
        where: {
          userId,
          expense: {
            AND: [
              { payeeId: { not: null } },
              { payeeId: { not: userId } },
            ],
          },
        },
        include: {
          expense: {
            include: {
              payee: { select: USER_SELECT },
              group: { select: { name: true } },
            },
          },
          payments: {
            where: { isVerified: true },
            select: { amountPaid: true },
          },
        },
      }),

      // Splits others owe the user (user is the payee of the expense)
      this.prisma.expenseSplit.findMany({
        where: {
          userId: { not: userId },
          expense: { payeeId: userId },
        },
        include: {
          user: { select: USER_SELECT },
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

      // Monthly spent — all PersonalTransaction EXPENSE records in the selected month
      this.prisma.personalTransaction.aggregate({
        where: {
          userId,
          type: PersonalTransactionType.EXPENSE,
          date: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      }),

      // Recent activity feed — last 10 PersonalTransactions, group context included
      this.prisma.personalTransaction.findMany({
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

      // All-time CREDIT total — drives Net Balance
      this.prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.CREDIT },
        _sum: { amount: true },
      }),

      // All-time EXPENSE total — drives Net Balance
      this.prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const unwrap = <T>(idx: number, fallback: T, label: string): T => {
      const r = settled[idx];
      if (r && r.status === 'fulfilled') return r.value as T;
      this.logger.error(`Dashboard section "${label}" failed`, r && r.status === 'rejected' ? r.reason : 'unknown');
      return fallback;
    };

    const payableSplits = unwrap<Array<{ amount: number; expense: { payee?: { name: string } | null; group: { name: string } }; payments: Array<{ amountPaid: number }> }>>(0, [], 'payableSplits');
    const receivableSplits = unwrap<Array<{ amount: number; user?: { name: string } | null; expense: { group: { name: string } }; payments: Array<{ amountPaid: number }> }>>(1, [], 'receivableSplits');
    const spentAggregate = unwrap<{ _sum: { amount: number | null } }>(2, { _sum: { amount: 0 } }, 'spentAggregate');
    const recentFeedRows = unwrap<Array<{ id: string; description: string | null; type: PersonalTransactionType; amount: number; date: Date; isFromGroup: boolean; category: string | null; source: string | null; expenseSplit: { expense: { group: { id: string; name: string } | null } | null } | null }>>(3, [], 'recentFeedRows');
    const allTimeCreditAggregate = unwrap<{ _sum: { amount: number | null } }>(4, { _sum: { amount: 0 } }, 'allTimeCreditAggregate');
    const allTimeExpenseAggregate = unwrap<{ _sum: { amount: number | null } }>(5, { _sum: { amount: 0 } }, 'allTimeExpenseAggregate');

    // ── Debt calculations ─────────────────────────────────────────────────────
    // Use split.amount (the user's share) minus verified payments on that split.
    const payables = payableSplits
      .map((split) => {
        const paid = split.payments.reduce((s, p) => s + p.amountPaid, 0);
        return {
          to: split.expense.payee?.name ?? 'Unknown',
          amount: Math.max(0, split.amount - paid),
          group: split.expense.group.name,
        };
      })
      .filter((p) => p.amount > 0.01);

    const receivables = receivableSplits
      .map((split) => {
        const paid = split.payments.reduce((s, p) => s + p.amountPaid, 0);
        return {
          from: split.user?.name ?? 'Unknown',
          amount: Math.max(0, split.amount - paid),
          group: split.expense.group.name,
        };
      })
      .filter((r) => r.amount > 0.01);

    // Totals derived from the filtered, net-amount lists — consistent with what the UI shows
    const totalPayable = payables.reduce((s, p) => s + p.amount, 0);
    const totalReceivable = receivables.reduce((s, r) => s + r.amount, 0);
    // Net balance = all-time credits minus all-time expenses across personal transactions
    const netBalance =
      (allTimeCreditAggregate._sum.amount ?? 0) -
      (allTimeExpenseAggregate._sum.amount ?? 0);

    // ── Recent activity feed ──────────────────────────────────────────────────
    const recentFeed = recentFeedRows.map((tx) => ({
      id: tx.id,
      label:
        tx.description ??
        (tx.type === PersonalTransactionType.CREDIT ? 'Cash in' : 'Expense'),
      sublabel: tx.isFromGroup
        ? `Group: ${tx.expenseSplit?.expense?.group?.name ?? 'Unknown'}`
        : [tx.category, tx.source].filter(Boolean).join(' · '),
      amount: tx.amount,
      date: tx.date.toISOString(),
      isCredit: tx.type === PersonalTransactionType.CREDIT,
      isFromGroup: tx.isFromGroup,
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
}
