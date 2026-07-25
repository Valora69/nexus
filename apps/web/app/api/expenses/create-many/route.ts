import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { createManyExpensesSchema } from '@/lib/server/schemas/expense';
import { createManyExpenses } from '@/lib/server/services/expense';

export const maxDuration = 60;

/**
 * POST /api/expenses/create-many  [Auth]
 * Create multiple expenses in a single transaction.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createManyExpensesSchema, body);
  const expenses = await createManyExpenses(dto, user.sub);
  return NextResponse.json(expenses);
});
