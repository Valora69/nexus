import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { updateExpenseSchema } from '@/lib/server/schemas/expense';
import {
  findOneExpense,
  updateExpense,
  removeExpense,
} from '@/lib/server/services/expense';
import { prisma } from '@/lib/server/db';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/expenses/:id  [Auth]
 * Find an expense by id. Includes membership check: user must be payer,
 * payee, in a split, or a group member. Returns 403 otherwise.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const expense = await findOneExpense(id);

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  // Authz: payer, payee, split member, or group member
  const isPayer = expense.payer?.id === user.sub;
  const isPayee = expense.payee?.id === user.sub;
  const isSplitMember = expense.splits.some((s) => s.user.id === user.sub);

  if (!isPayer && !isPayee && !isSplitMember) {
    const member = await prisma.groupMember.findUnique({
      where: {
        GroupMemberUnique: { userId: user.sub, groupId: expense.group.id },
      },
      select: { id: true },
    });
    if (!member) {
      throw new ApiError(
        403,
        'You do not have permission to view this expense',
      );
    }
  }

  return NextResponse.json(expense);
});

/**
 * PATCH /api/expenses/:id  [Auth]
 * Update an expense.
 */
export const PATCH = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const dto = parseBody(updateExpenseSchema, body);
  const updatedExpense = await updateExpense(id, dto, user.sub);
  return NextResponse.json(updatedExpense);
});

/**
 * DELETE /api/expenses/:id  [Auth]
 * Delete an expense. Authorization: payer, payee, or group member.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const deletedExpense = await removeExpense(id, user.sub);
  return NextResponse.json(deletedExpense);
});
