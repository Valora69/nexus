import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseQuery } from '@/lib/server/validation';
import { paginationSchema } from '@/lib/server/schemas/expense-split';
import { findByExpenseId } from '@/lib/server/services/expense-split';
import { prisma } from '@/lib/server/db';

type Ctx = { params: Promise<{ expenseId: string }> };

/**
 * GET /api/expense-splits/expense/:expenseId  [Auth]
 * Splits for a given expense. Verifies user is a group member.
 */
export const GET = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { expenseId } = await ctx.params;
  const { skip, take } = parseQuery(paginationSchema, req.nextUrl.searchParams);

  // Verify user is a member of the expense's group
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true },
  });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      GroupMemberUnique: { groupId: expense.groupId, userId: user.sub },
    },
    select: { id: true },
  });
  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const splits = await findByExpenseId(expenseId, skip, take);
  return NextResponse.json(splits);
});
