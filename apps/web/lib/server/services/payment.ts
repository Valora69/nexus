import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { logActivity } from '@/lib/server/activity';
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from '@/lib/server/schemas/payment';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

const PAYMENT_INCLUDE = {
  expenseSplit: {
    include: {
      user: { select: USER_SELECT },
      expense: {
        include: {
          payer: { select: USER_SELECT },
          payee: { select: USER_SELECT },
          group: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

const PAYMENT_AUTH_SELECT = {
  id: true,
  expenseSplit: {
    select: {
      userId: true,
      expense: {
        select: { groupId: true, payeeId: true },
      },
    },
  },
} as const;

const PAYMENT_WRITE_SELECT = {
  id: true,
  amountPaid: true,
  paymentMethod: true,
  isVerified: true,
  verifiedAt: true,
  paidAt: true,
  expenseSplitId: true,
} as const;

export async function create(dto: CreatePaymentInput, userId: string) {
  try {
    const split = await prisma.expenseSplit.findUnique({
      where: { id: dto.expenseSplitId },
      include: {
        expense: true,
        user: true,
        payments: { select: { amountPaid: true } },
      },
    });

    if (!split) {
      throw new ApiError(404, 'Expense split not found');
    }

    if (split.userId !== userId) {
      throw new ApiError(
        403,
        'You can only create payments for your own splits',
      );
    }

    const claimed = split.payments.reduce((s, p) => s + p.amountPaid, 0);
    const remaining = split.amount - claimed;
    if (dto.amountPaid > remaining + 0.01) {
      throw new ApiError(
        400,
        `Payment exceeds remaining balance of ${remaining.toFixed(2)}`,
      );
    }

    const createdPayment = await prisma.payment.create({
      data: dto,
      select: PAYMENT_WRITE_SELECT,
    });

    await logActivity({
      groupId: split.expense.groupId,
      activityName: ActivityNameEnum.CREATED,
      activityOn: ActivityOnEnum.PAYMENT,
      createdByUserId: userId,
    });

    return createdPayment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to create payment', error);
    throw new ApiError(500, 'Failed to create payment');
  }
}

export async function findAll(userId: string, skip?: number, take?: number) {
  try {
    return await prisma.payment.findMany({
      where: {
        OR: [
          { expenseSplit: { userId } },
          { expenseSplit: { expense: { payerId: userId } } },
        ],
      },
      include: PAYMENT_INCLUDE,
      orderBy: { paidAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch payments', error);
    throw new ApiError(500, 'Failed to fetch payments');
  }
}

export async function findPendingVerification(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    return await prisma.payment.findMany({
      where: {
        isVerified: false,
        expenseSplit: {
          expense: {
            payeeId: userId,
          },
          userId: { not: userId },
        },
      },
      include: PAYMENT_INCLUDE,
      orderBy: { paidAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch pending verification payments', error);
    throw new ApiError(500, 'Failed to fetch pending payments');
  }
}

export async function findPendingConfirmation(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    return await prisma.payment.findMany({
      where: {
        isVerified: false,
        expenseSplit: {
          userId: userId,
        },
      },
      include: PAYMENT_INCLUDE,
      orderBy: { paidAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch pending confirmation payments', error);
    throw new ApiError(500, 'Failed to fetch pending confirmations');
  }
}

export async function findOne(id: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    return payment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to fetch payment', error);
    throw new ApiError(500, 'Failed to fetch payment');
  }
}

export async function updatePayment(
  id: string,
  dto: UpdatePaymentInput,
  userId: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: PAYMENT_AUTH_SELECT,
  });
  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  const canUpdate =
    payment.expenseSplit.userId === userId ||
    payment.expenseSplit.expense.payeeId === userId;
  if (!canUpdate) {
    throw new ApiError(
      403,
      'You do not have permission to update this payment',
    );
  }

  try {
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.isVerified && { verifiedAt: new Date() }),
      },
      select: PAYMENT_WRITE_SELECT,
    });

    await logActivity({
      groupId: payment.expenseSplit.expense.groupId,
      activityName: ActivityNameEnum.UPDATED,
      activityOn: ActivityOnEnum.PAYMENT,
      createdByUserId: userId,
    });

    return updatedPayment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to update payment', error);
    throw new ApiError(500, 'Failed to update payment');
  }
}

export async function remove(id: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: PAYMENT_AUTH_SELECT,
  });
  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }
  if (payment.expenseSplit.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own payments');
  }

  const groupId = payment.expenseSplit.expense.groupId;

  try {
    const deletedPayment = await prisma.payment.delete({
      where: { id },
      select: { id: true },
    });

    await logActivity({
      groupId,
      activityName: ActivityNameEnum.DELETED,
      activityOn: ActivityOnEnum.PAYMENT,
      createdByUserId: userId,
    });

    return deletedPayment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to delete payment', error);
    throw new ApiError(500, 'Failed to delete payment');
  }
}
