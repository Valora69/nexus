import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { ApiError } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';
import { updateExpenseSplitSchema } from '@/lib/server/schemas/expense-split';
import { findOne, update } from '@/lib/server/services/expense-split';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/expense-splits/:id  [Auth]
 * Find one expense split. Verifies user is split owner, or payer/payee on expense.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const split = await findOne(id);

  const isOwner = split.userId === user.sub;
  const isPayer = split.expense.payer?.id === user.sub;
  const isPayee = split.expense.payee?.id === user.sub;
  if (!isOwner && !isPayer && !isPayee) {
    throw new ApiError(403, 'You do not have permission to view this split');
  }

  return NextResponse.json(split);
});

/**
 * PATCH /api/expense-splits/:id  [Auth]
 * Update an expense split. Verifies user is split owner or expense payee.
 */
export const PATCH = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;

  // Ownership check before update
  const split = await findOne(id);
  const isOwner = split.userId === user.sub;
  const isPayee = split.expense.payee?.id === user.sub;
  if (!isOwner && !isPayee) {
    throw new ApiError(403, 'You do not have permission to update this split');
  }

  const body = await req.json();
  const dto = parseBody(updateExpenseSplitSchema, body);
  const updated = await update(id, dto);
  return NextResponse.json(updated);
});
