import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import {
  createExpenseSchema,
  expenseQuerySchema,
} from '@/lib/server/schemas/expense';
import { createExpense, findAllExpenses } from '@/lib/server/services/expense';

/**
 * POST /api/expenses  [Auth]
 * Create a single expense.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createExpenseSchema, body);
  const expense = await createExpense(dto, user.sub);
  return NextResponse.json(expense);
});

/**
 * GET /api/expenses  [Auth]
 * List expenses for the authenticated user.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { type, groupId, skip, take } = parseQuery(
    expenseQuerySchema,
    req.nextUrl.searchParams,
  );
  const expenses = await findAllExpenses(user.sub, type, groupId, skip, take);
  return NextResponse.json(expenses);
});
