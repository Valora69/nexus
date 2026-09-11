import { ActivityNameEnum, ActivityOnEnum, Prisma } from '@prisma/client';
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
  isVerified: true,
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
  clientRequestId: true,
} as const;

/**
 * Result envelope mirrors createExpense: `replayed=true` on a
 * clientRequestId hit. Route unwraps to keep the wire shape stable.
 */
export async function create(
  dto: CreatePaymentInput,
  userId: string,
  clientRequestId?: string,
) {
  // Fast path: outbox replay. Skip the transaction entirely if the same
  // clientRequestId already produced a payment — no re-check of the split
  // balance, no duplicate Activity row.
  if (clientRequestId) {
    const existing = await prisma.payment.findUnique({
      where: { clientRequestId },
      select: PAYMENT_WRITE_SELECT,
    });
    if (existing) {
      return { payment: existing, replayed: true as const };
    }
  }

  try {
    const { createdPayment, groupId } = await prisma.$transaction(
      async (tx) => {
        // Lock the split row so concurrent payments for the same split
        // serialize here instead of each reading a stale payments snapshot
        // and both passing the remaining-balance check (which would overpay).
        await tx.$queryRaw`SELECT id FROM "ExpenseSplit" WHERE id = ${dto.expenseSplitId} FOR UPDATE`;

        const split = await tx.expenseSplit.findUnique({
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

        if (split.userId === split.expense.payeeId) {
          throw new ApiError(
            400,
            'You fronted this expense — your own share is not owed to anyone',
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

        const createdPayment = await tx.payment.create({
          data: {
            ...dto,
            // Always starts unverified; only the payee can verify via PATCH.
            isVerified: false,
            ...(clientRequestId ? { clientRequestId } : {}),
          },
          select: PAYMENT_WRITE_SELECT,
        });

        return { createdPayment, groupId: split.expense.groupId };
      },
      { timeout: 10000 },
    );

    await logActivity({
      groupId,
      activityName: ActivityNameEnum.CREATED,
      activityOn: ActivityOnEnum.PAYMENT,
      createdByUserId: userId,
    });

    return { payment: createdPayment, replayed: false as const };
  } catch (error) {
    // Concurrent-replay race: the other writer beat us to the unique
    // index. Return their row instead of surfacing a duplicate-key error.
    if (
      clientRequestId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const hitClientRequestId = Array.isArray(target)
        ? target.includes('clientRequestId')
        : target === 'clientRequestId' ||
          target === 'Payment_clientRequestId_key';
      if (hitClientRequestId) {
        const raced = await prisma.payment.findUnique({
          where: { clientRequestId },
          select: PAYMENT_WRITE_SELECT,
        });
        if (raced) return { payment: raced, replayed: true as const };
      }
    }
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
          // payee = recipient of the payment. payerId is kept so rows that
          // matched before (legacy "first owing member") don't disappear.
          { expenseSplit: { expense: { payeeId: userId } } },
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

export async function findOne(id: string, userId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    // Only the two parties to the payment may read it.
    const canView =
      payment.expenseSplit.userId === userId ||
      payment.expenseSplit.expense.payeeId === userId;
    if (!canView) {
      throw new ApiError(
        403,
        'You do not have permission to view this payment',
      );
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

  const isSplitOwner = payment.expenseSplit.userId === userId;
  const isPayee = payment.expenseSplit.expense.payeeId === userId;
  if (!isSplitOwner && !isPayee) {
    throw new ApiError(
      403,
      'You do not have permission to update this payment',
    );
  }

  // Only the recipient can confirm receipt; the payer can't self-verify.
  if (dto.isVerified !== undefined && !isPayee) {
    throw new ApiError(403, 'Only the payee can verify this payment');
  }
  if (
    (dto.paymentMethod !== undefined || dto.paymentProof !== undefined) &&
    !isSplitOwner
  ) {
    throw new ApiError(403, 'Only the payer can edit payment details');
  }

  if (payment.isVerified) {
    // Re-verifying (double-click, retry) is a harmless no-op.
    const isReverify =
      dto.isVerified === true &&
      dto.paymentMethod === undefined &&
      dto.paymentProof === undefined;
    if (isReverify) {
      return prisma.payment.findUniqueOrThrow({
        where: { id },
        select: PAYMENT_WRITE_SELECT,
      });
    }
    throw new ApiError(409, 'Verified payments can no longer be changed');
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
  if (payment.isVerified) {
    throw new ApiError(409, 'Verified payments cannot be deleted');
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
