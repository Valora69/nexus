import {
  ActivityNameEnum,
  ActivityOnEnum,
  PersonalTransactionType,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { logActivity } from '@/lib/server/activity';
import type {
  CreateExpenseInput,
  CreateManyExpensesInput,
  UpdateExpenseInput,
} from '@/lib/server/schemas/expense';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

const EXPENSE_READ_INCLUDE = {
  group: { select: { id: true, name: true } },
  payer: { select: USER_SELECT },
  payee: { select: USER_SELECT },
  splits: {
    include: {
      user: { select: USER_SELECT },
    },
  },
} as const;

const EXPENSE_WRITE_SELECT = {
  id: true,
  name: true,
  totalAmount: true,
  date: true,
  groupId: true,
  payerId: true,
  payeeId: true,
  group: { select: { name: true } },
  splits: { select: { id: true, userId: true, amount: true } },
} as const;

// ---------------------------------------------------------------------------
// Validation helpers (use top-level prisma, NOT tx — intentional)
// ---------------------------------------------------------------------------

async function validateGroupExists(groupId: string) {
  try {
    return await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
  } catch {
    console.error('Failed to validate group existence');
    throw new ApiError(500, 'Failed to validate group');
  }
}

async function validateUserExists(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  } catch {
    console.error('Failed to validate user');
    throw new ApiError(500, 'Failed to validate user');
  }
}

async function validateGroupMembership(userId: string, groupId: string) {
  try {
    return await prisma.groupMember.findUnique({
      where: {
        GroupMemberUnique: { userId, groupId },
      },
      select: { id: true },
    });
  } catch {
    console.error('Failed to validate group membership');
    throw new ApiError(500, 'Failed to validate group membership');
  }
}

// ---------------------------------------------------------------------------
// createExpenseInTx
// ---------------------------------------------------------------------------

async function createExpenseInTx(
  tx: Prisma.TransactionClient,
  dto: CreateExpenseInput,
  userId: string,
) {
  const { groupId, payeeId, payerId, splits, ...rest } = dto;

  // Validations use top-level prisma since they're reads — fine outside tx
  await validateGroupExists(groupId);
  if (userId) {
    await Promise.all([
      validateUserExists(userId),
      validateGroupMembership(userId, groupId),
    ]);
  }

  if (splits && splits.length > 0) {
    const totalSplitAmount = splits.reduce(
      (sum, split) => sum + split.amount,
      0,
    );
    if (Math.abs(totalSplitAmount - rest.totalAmount) > 0.01) {
      throw new ApiError(400, 'Split amounts must equal total expense amount');
    }
    await Promise.all(
      splits.map((split) => validateGroupMembership(split.userId, groupId)),
    );
  }

  const expense = await tx.expense.create({
    data: {
      payer: { connect: { id: payerId } },
      ...(payeeId && { payee: { connect: { id: payeeId } } }),
      group: { connect: { id: groupId } },
      ...(splits &&
        splits.length > 0 && {
          splits: {
            create: splits.map((split) => ({
              user: { connect: { id: split.userId } },
              amount: split.amount,
            })),
          },
        }),
      ...rest,
    },
    select: EXPENSE_WRITE_SELECT,
  });

  if (expense.splits && expense.splits.length > 0) {
    await tx.personalTransaction.createMany({
      data: expense.splits.map((split) => ({
        userId: split.userId,
        type: PersonalTransactionType.EXPENSE,
        amount: split.amount,
        description: expense.name,
        category: expense.group.name,
        isFromGroup: true,
        expenseSplitId: split.id,
        date: expense.date,
      })),
    });
  }

  return expense;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

export async function createExpense(dto: CreateExpenseInput, userId: string) {
  try {
    const createdExpense = await prisma.$transaction((tx) =>
      createExpenseInTx(tx, dto, userId),
    );

    await logActivity({
      createdByUserId: userId,
      activityName: ActivityNameEnum.CREATED,
      activityOn: ActivityOnEnum.EXPENSE,
      groupId: dto.groupId,
    });

    return createdExpense;
  } catch (error) {
    console.error('Error creating expense', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to create expense');
  }
}

// ---------------------------------------------------------------------------
// createMany
// ---------------------------------------------------------------------------

export async function createManyExpenses(
  dto: CreateManyExpensesInput,
  userId: string,
) {
  const { expenses } = dto;
  try {
    const createdExpenses = await prisma.$transaction(
      async (tx) => {
        const results = [];
        for (const expenseDto of expenses) {
          results.push(await createExpenseInTx(tx, expenseDto, userId));
        }
        return results;
      },
      { timeout: 15000 },
    );

    // Emit activities outside the tx
    for (const expenseDto of expenses) {
      await logActivity({
        createdByUserId: userId,
        activityName: ActivityNameEnum.CREATED,
        activityOn: ActivityOnEnum.EXPENSE,
        groupId: expenseDto.groupId,
      });
    }

    return createdExpenses;
  } catch (error) {
    console.error('Error creating multiple expenses', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to create expenses');
  }
}

// ---------------------------------------------------------------------------
// findAll
// ---------------------------------------------------------------------------

export async function findAllExpenses(
  userId: string,
  type?: 'payable' | 'receivable',
  groupId?: string,
  skip?: number,
  take?: number,
) {
  try {
    let whereClause: Record<string, unknown> = {};

    if (userId) {
      switch (type) {
        case 'payable':
          whereClause = { payerId: userId };
          break;
        case 'receivable':
          whereClause = { payeeId: userId };
          break;
        default:
          whereClause = {
            OR: [
              { payeeId: userId },
              { payerId: userId },
              { splits: { some: { userId } } },
            ],
          };
          break;
      }
    }

    if (groupId) {
      whereClause = { ...whereClause, groupId };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: EXPENSE_READ_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
    return expenses;
  } catch {
    console.error('Error getting expenses');
    throw new ApiError(500, 'Failed to fetch expenses');
  }
}

// ---------------------------------------------------------------------------
// findOne
// ---------------------------------------------------------------------------

export async function findOneExpense(id: string) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: EXPENSE_READ_INCLUDE,
    });
    return expense;
  } catch {
    console.error('Failed to retrieve expense');
    throw new ApiError(500, 'Failed to retrieve expense');
  }
}

// ---------------------------------------------------------------------------
// updateWithSplits (private helper)
// ---------------------------------------------------------------------------

async function updateWithSplits(
  id: string,
  existing: {
    id: string;
    totalAmount: number;
    groupId: string;
    splits: Array<{
      id: string;
      payments: Array<{ isVerified: boolean }>;
    }>;
  },
  dto: UpdateExpenseInput,
  userId: string,
) {
  const { splits, payeeId, payerId, groupId, ...rest } = dto;

  // Settlement-safety: any verified payment locks the expense from split edits.
  const hasVerifiedPayments = existing.splits.some((s) =>
    s.payments.some((p) => p.isVerified),
  );
  if (hasVerifiedPayments) {
    throw new ApiError(
      409,
      'Cannot edit splits: this expense has verified payments. Delete and recreate it instead.',
    );
  }

  if (!splits || splits.length === 0) {
    throw new ApiError(
      400,
      'Splits array must be non-empty when editing splits',
    );
  }

  const effectiveTotal = rest.totalAmount ?? existing.totalAmount;
  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(totalSplit - effectiveTotal) > 0.01) {
    throw new ApiError(400, 'Split amounts must equal total expense amount');
  }

  const effectiveGroupId = groupId ?? existing.groupId;
  await Promise.all(
    splits.map((s) => validateGroupMembership(s.userId, effectiveGroupId)),
  );

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const oldSplitIds = existing.splits.map((s) => s.id);

      if (oldSplitIds.length > 0) {
        await tx.personalTransaction.deleteMany({
          where: { expenseSplitId: { in: oldSplitIds } },
        });
        await tx.expenseSplit.deleteMany({
          where: { expenseId: id },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...rest };
      if (payerId) updateData.payer = { connect: { id: payerId } };
      if (payeeId) updateData.payee = { connect: { id: payeeId } };
      if (groupId) updateData.group = { connect: { id: groupId } };
      updateData.splits = {
        create: splits.map((s) => ({
          user: { connect: { id: s.userId } },
          amount: s.amount,
        })),
      };

      const expense = await tx.expense.update({
        where: { id },
        data: updateData,
        select: EXPENSE_WRITE_SELECT,
      });

      if (expense.splits && expense.splits.length > 0) {
        await tx.personalTransaction.createMany({
          data: expense.splits.map((s) => ({
            userId: s.userId,
            type: PersonalTransactionType.EXPENSE,
            amount: s.amount,
            description: expense.name,
            category: expense.group.name,
            isFromGroup: true,
            expenseSplitId: s.id,
            date: expense.date,
          })),
        });
      }

      return expense;
    });

    await logActivity({
      groupId: updated.groupId,
      activityName: ActivityNameEnum.UPDATED,
      activityOn: ActivityOnEnum.EXPENSE,
      createdByUserId: userId,
    });

    return updated;
  } catch (error) {
    console.error('Failed to update expense with splits', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to update expense');
  }
}

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

export async function updateExpense(
  id: string,
  dto: UpdateExpenseInput,
  userId: string,
) {
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: {
      splits: { include: { payments: true } },
    },
  });
  if (!existing) {
    throw new ApiError(404, 'Expense not found');
  }

  const { splits, payeeId, payerId, groupId, ...rest } = dto;

  // If splits are provided, perform a full atomic replace with safety checks.
  if (splits !== undefined) {
    return updateWithSplits(id, existing, dto, userId);
  }

  // Metadata-only update
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...rest };
    if (payerId) updateData.payer = { connect: { id: payerId } };
    if (payeeId) updateData.payee = { connect: { id: payeeId } };
    if (groupId) updateData.group = { connect: { id: groupId } };

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      select: EXPENSE_WRITE_SELECT,
    });

    let activityOn: ActivityOnEnum = ActivityOnEnum.EXPENSE;
    if (payeeId && !payerId) activityOn = ActivityOnEnum.EXPENSE_PAYEE;
    else if (payerId && !payeeId) activityOn = ActivityOnEnum.EXPENSE_PAYER;

    await logActivity({
      groupId: updatedExpense.groupId,
      activityName: ActivityNameEnum.UPDATED,
      activityOn,
      createdByUserId: userId,
    });

    return updatedExpense;
  } catch (error) {
    console.error('Failed to update expense');
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to update expense');
  }
}

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

export async function removeExpense(id: string, userId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { id: true, groupId: true, payerId: true, payeeId: true },
  });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  // Authorization: payer, payee, or any group member may delete.
  const isPrincipal = expense.payerId === userId || expense.payeeId === userId;
  if (!isPrincipal) {
    const member = await prisma.groupMember.findUnique({
      where: { GroupMemberUnique: { userId, groupId: expense.groupId } },
      select: { id: true },
    });
    if (!member) {
      throw new ApiError(
        403,
        'You do not have permission to delete this expense',
      );
    }
  }

  try {
    const deletedExpense = await prisma.expense.delete({
      where: { id },
    });

    if (deletedExpense) {
      await logActivity({
        groupId: deletedExpense.groupId,
        activityName: ActivityNameEnum.DELETED,
        activityOn: ActivityOnEnum.EXPENSE,
        createdByUserId: userId,
      });
    }
    return deletedExpense;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to delete expense', error);
    throw new ApiError(500, 'Failed to delete expense');
  }
}
