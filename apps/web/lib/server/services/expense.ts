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
  clientRequestId: true,
  group: { select: { name: true } },
  splits: { select: { id: true, userId: true, amount: true } },
} as const;

// ---------------------------------------------------------------------------
// Validation helpers — call BEFORE opening a transaction, never inside one.
// An interactive tx pins a pooled connection; a top-level `prisma` query
// issued from inside the callback has to wait for a second connection, and
// on Vercel that wait blew the 5s tx timeout (P2028) on every group-expense
// create.
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

/** Returns the subset of `userIds` that are NOT members of `groupId`. */
async function findNonMembers(groupId: string, userIds: string[]) {
  const unique = [...new Set(userIds)];
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: unique } },
      select: { userId: true },
    });
    const found = new Set(members.map((m) => m.userId));
    return unique.filter((id) => !found.has(id));
  } catch {
    console.error('Failed to validate group membership');
    throw new ApiError(500, 'Failed to validate group membership');
  }
}

async function validateCreateExpense(dto: CreateExpenseInput, userId: string) {
  const { groupId, payerId, payeeId, splits, totalAmount } = dto;
  const splitUserIds = (splits ?? []).map((split) => split.userId);

  if (splits && splits.length > 0) {
    // Caught here as a 400 rather than as a P2002 on
    // ExpenseSplit(expenseId, userId) mid-transaction.
    if (new Set(splitUserIds).size !== splitUserIds.length) {
      throw new ApiError(400, 'Each member can only appear once in splits');
    }
    const totalSplitAmount = splits.reduce(
      (sum, split) => sum + split.amount,
      0,
    );
    if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
      throw new ApiError(400, 'Split amounts must equal total expense amount');
    }
  }

  const [group, nonMembers] = await Promise.all([
    validateGroupExists(groupId),
    findNonMembers(groupId, [
      userId,
      payerId,
      ...(payeeId ? [payeeId] : []),
      ...splitUserIds,
    ]),
  ]);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }
  if (nonMembers.includes(userId)) {
    throw new ApiError(403, 'You are not a member of this group');
  }
  if (nonMembers.length > 0) {
    throw new ApiError(
      400,
      'Payer, payee, and split participants must be members of the group',
    );
  }
}

// ---------------------------------------------------------------------------
// createExpenseInTx — writes only; run validateCreateExpense first.
// ---------------------------------------------------------------------------

async function createExpenseInTx(
  tx: Prisma.TransactionClient,
  dto: CreateExpenseInput,
  clientRequestId?: string,
) {
  const { groupId, payeeId, payerId, splits, ...rest } = dto;

  const expense = await tx.expense.create({
    data: {
      payer: { connect: { id: payerId } },
      ...(payeeId && { payee: { connect: { id: payeeId } } }),
      group: { connect: { id: groupId } },
      ...(clientRequestId ? { clientRequestId } : {}),
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

/**
 * Result envelope: {expense, replayed}. `replayed=true` means the caller's
 * clientRequestId matched a previously-created expense; the record is
 * returned unchanged and no fresh Activity/PersonalTransaction rows are
 * written. The route layer strips this flag before responding — the wire
 * shape stays identical to a first-write response.
 */
export async function createExpense(
  dto: CreateExpenseInput,
  userId: string,
  clientRequestId?: string,
) {
  // Fast path: if this outbox row already landed once, hand back the same
  // record without re-entering the transaction. Cheap findUnique on the
  // unique index; the vast majority of retries take this branch, not the
  // P2002 race path below.
  if (clientRequestId) {
    const existing = await prisma.expense.findUnique({
      where: { clientRequestId },
      select: EXPENSE_WRITE_SELECT,
    });
    if (existing) {
      return { expense: existing, replayed: true as const };
    }
  }

  await validateCreateExpense(dto, userId);

  try {
    const createdExpense = await prisma.$transaction(
      (tx) => createExpenseInTx(tx, dto, clientRequestId),
      { timeout: 10000 },
    );

    await logActivity({
      createdByUserId: userId,
      activityName: ActivityNameEnum.CREATED,
      activityOn: ActivityOnEnum.EXPENSE,
      groupId: dto.groupId,
    });

    return { expense: createdExpense, replayed: false as const };
  } catch (error) {
    // P2002 with the clientRequestId target = a concurrent replay of the
    // same outbox row won the race. Refetch and return the winner's row;
    // never surface a "duplicate key" error to a legitimately-retried
    // idempotent write.
    if (
      clientRequestId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target;
      const hitClientRequestId = Array.isArray(target)
        ? target.includes('clientRequestId')
        : target === 'clientRequestId' ||
          target === 'Expense_clientRequestId_key';
      if (hitClientRequestId) {
        const raced = await prisma.expense.findUnique({
          where: { clientRequestId },
          select: EXPENSE_WRITE_SELECT,
        });
        if (raced) return { expense: raced, replayed: true as const };
      }
    }
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
  await Promise.all(
    expenses.map((expenseDto) => validateCreateExpense(expenseDto, userId)),
  );

  try {
    const createdExpenses = await prisma.$transaction(
      async (tx) => {
        const results = [];
        for (const expenseDto of expenses) {
          results.push(await createExpenseInTx(tx, expenseDto));
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

  const splitUserIds = splits.map((s) => s.userId);
  if (new Set(splitUserIds).size !== splitUserIds.length) {
    throw new ApiError(400, 'Each member can only appear once in splits');
  }

  const effectiveTotal = rest.totalAmount ?? existing.totalAmount;
  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(totalSplit - effectiveTotal) > 0.01) {
    throw new ApiError(400, 'Split amounts must equal total expense amount');
  }

  const effectiveGroupId = groupId ?? existing.groupId;
  const nonMembers = await findNonMembers(effectiveGroupId, splitUserIds);
  if (nonMembers.length > 0) {
    throw new ApiError(
      400,
      'All split participants must be members of the group',
    );
  }

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
