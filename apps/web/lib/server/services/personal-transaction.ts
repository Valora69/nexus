import { prisma } from '@/lib/server/db';
import { PersonalTransactionType } from '@prisma/client';
import { ApiError } from '@/lib/server/errors';
import { parseQuickCapture } from './quick-capture-parser';
import type { CreatePersonalTransactionInput } from '@/lib/server/schemas/personal-transaction';

export async function quickCapture(input: string, userId: string) {
  let parsed;
  try {
    parsed = parseQuickCapture(input);
  } catch (err) {
    throw new ApiError(
      400,
      err instanceof Error ? err.message : 'Invalid input',
    );
  }

  return prisma.personalTransaction.create({
    data: {
      userId,
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.category,
      source: parsed.source,
    },
  });
}

export async function create(
  dto: CreatePersonalTransactionInput,
  userId: string,
) {
  return prisma.personalTransaction.create({
    data: {
      userId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      category: dto.category,
      source: dto.source,
    },
  });
}

export async function findAll(
  userId: string,
  type?: PersonalTransactionType,
  skip?: number,
  take?: number,
) {
  return prisma.personalTransaction.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
    },
    select: {
      id: true,
      userId: true,
      type: true,
      amount: true,
      description: true,
      category: true,
      source: true,
      isFromGroup: true,
      expenseSplitId: true,
      date: true,
      createdAt: true,
      updatedAt: true,
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
    skip: skip ?? undefined,
    take: Math.min(take ?? 100, 100),
  });
}

export async function remove(id: string, userId: string) {
  const transaction = await prisma.personalTransaction.findUnique({
    where: { id },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new ApiError(400, 'Transaction not found or not owned by user');
  }

  if (transaction.isFromGroup && transaction.expenseSplitId != null) {
    throw new ApiError(
      400,
      'Group-linked transactions cannot be deleted directly',
    );
  }

  return prisma.personalTransaction.delete({ where: { id } });
}

export async function getSummary(userId: string) {
  const [totalExpensesAgg, totalCreditsAgg, totalGroupExpensesAgg] =
    await Promise.all([
      prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      prisma.personalTransaction.aggregate({
        where: {
          userId,
          type: PersonalTransactionType.EXPENSE,
          isFromGroup: true,
        },
        _sum: { amount: true },
      }),
    ]);

  const totalExpenses = totalExpensesAgg._sum.amount ?? 0;
  const totalCredits = totalCreditsAgg._sum.amount ?? 0;
  const totalGroupExpenses = totalGroupExpensesAgg._sum.amount ?? 0;
  const personalExpenses = totalExpenses - totalGroupExpenses;

  return {
    totalExpenses,
    totalCredits,
    netBalance: totalCredits - totalExpenses,
    breakdown: {
      personalExpenses,
      groupExpenses: totalGroupExpenses,
    },
  };
}
