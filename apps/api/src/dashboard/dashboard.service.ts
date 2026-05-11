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

    const [
      payableSplits,
      receivableSplits,
      verifiedReceivedAggregate,
      spentAggregate,
      recentFeedRows,
    ] = await Promise.all([
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

      // Total verified payments the current user has received (as payee)
      this.prisma.payment.aggregate({
        where: {
          isVerified: true,
          expenseSplit: {
            expense: { payeeId: userId },
            userId: { not: userId },
          },
        },
        _sum: { amountPaid: true },
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
    ]);

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
    // Net balance = realized cash received from verified payments (receivables → available)
    const netBalance = verifiedReceivedAggregate._sum.amountPaid ?? 0;

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
