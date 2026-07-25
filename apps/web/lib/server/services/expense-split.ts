import { PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import type { UpdateExpenseSplitInput } from '@/lib/server/schemas/expense-split';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

const EXPENSE_SPLIT_INCLUDE = {
  user: { select: USER_SELECT },
  expense: {
    include: {
      group: { select: { id: true, name: true } },
      payer: { select: USER_SELECT },
      payee: { select: USER_SELECT },
    },
  },
  payments: true,
} as const;

const EXPENSE_SPLIT_WRITE_SELECT = {
  id: true,
  expenseId: true,
  userId: true,
  amount: true,
} as const;

function sumPayments(
  payments: Array<{ amountPaid: number; isVerified: boolean }>,
  verifiedOnly = false,
): number {
  return payments.reduce(
    (acc, p) => acc + (verifiedOnly && !p.isVerified ? 0 : p.amountPaid),
    0,
  );
}

/**
 * Scoped findAll: returns splits where the user is the split owner,
 * or is payer/payee on the parent expense.
 */
export async function findAll(userId: string, skip?: number, take?: number) {
  try {
    return await prisma.expenseSplit.findMany({
      where: {
        OR: [
          { userId },
          { expense: { payerId: userId } },
          { expense: { payeeId: userId } },
        ],
      },
      include: EXPENSE_SPLIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch expense splits', error);
    throw new ApiError(500, 'Failed to fetch expense splits');
  }
}

export async function findMyPayables(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    const splits = await prisma.expenseSplit.findMany({
      where: {
        userId,
        expense: {
          payeeId: { not: userId },
        },
      },
      include: EXPENSE_SPLIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
    const active = splits.filter(
      (s) => s.amount - sumPayments(s.payments, false) > 0.01,
    );
    return active;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch payable splits', error);
    throw new ApiError(500, 'Failed to fetch payable splits');
  }
}

export async function findMyReceivables(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    const splits = await prisma.expenseSplit.findMany({
      where: {
        expense: { payeeId: userId },
        userId: { not: userId },
      },
      include: EXPENSE_SPLIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
    const active = splits.filter(
      (s) => s.amount - sumPayments(s.payments, true) > 0.01,
    );
    return active;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch receivable splits', error);
    throw new ApiError(500, 'Failed to fetch receivable splits');
  }
}

export async function findByExpenseId(
  expenseId: string,
  skip?: number,
  take?: number,
) {
  try {
    return await prisma.expenseSplit.findMany({
      where: { expenseId },
      include: EXPENSE_SPLIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch splits by expense', error);
    throw new ApiError(500, 'Failed to fetch splits by expense');
  }
}

export async function findByUserId(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    return await prisma.expenseSplit.findMany({
      where: { userId },
      include: EXPENSE_SPLIT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch splits by user', error);
    throw new ApiError(500, 'Failed to fetch splits by user');
  }
}

export async function findOne(id: string) {
  try {
    const split = await prisma.expenseSplit.findUnique({
      where: { id },
      include: EXPENSE_SPLIT_INCLUDE,
    });
    if (!split) {
      throw new ApiError(404, `Expense split with ID ${id} not found`);
    }
    return split;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch expense split', error);
    throw new ApiError(500, 'Failed to fetch expense split');
  }
}

export async function update(id: string, dto: UpdateExpenseSplitInput) {
  const exists = await prisma.expenseSplit.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiError(404, `Expense split with ID ${id} not found`);
  }
  try {
    return await prisma.expenseSplit.update({
      where: { id },
      data: dto,
      select: EXPENSE_SPLIT_WRITE_SELECT,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to update expense split', error);
    throw new ApiError(500, 'Failed to update expense split');
  }
}

export async function markAsPaid(
  id: string,
  userId: string,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  paymentProof?: string,
) {
  const split = await findOne(id);

  if (split.userId !== userId) {
    throw new ApiError(403, 'You can only record payments on your own splits');
  }

  if (!isFinite(amountPaid) || amountPaid <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero');
  }

  const claimed = sumPayments(split.payments, false);
  const remaining = split.amount - claimed;
  if (remaining <= 0.01) {
    throw new ApiError(
      400,
      'This split is already fully paid (or has pending payments covering it)',
    );
  }
  if (amountPaid > remaining + 0.01) {
    throw new ApiError(
      400,
      `Payment exceeds remaining balance of ${remaining.toFixed(2)}`,
    );
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        amountPaid,
        paymentMethod,
        paymentProof,
        isVerified: false,
        expenseSplitId: id,
      },
    });

    const updatedSplit = await findOne(id);

    return { payment, split: updatedSplit };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error recording payment on split', error);
    throw new ApiError(500, 'Failed to record payment');
  }
}
