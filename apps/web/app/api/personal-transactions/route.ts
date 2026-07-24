import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import {
  createPersonalTransactionSchema,
  personalTransactionQuerySchema,
} from '@/lib/server/schemas/personal-transaction';
import { create, findAll } from '@/lib/server/services/personal-transaction';

/**
 * POST /api/personal-transactions  [Auth]
 * Create a personal transaction.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createPersonalTransactionSchema, body);
  const transaction = await create(dto, user.sub);
  return NextResponse.json(transaction);
});

/**
 * GET /api/personal-transactions  [Auth]
 * List personal transactions for the authenticated user.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { type, skip, take } = parseQuery(
    personalTransactionQuerySchema,
    req.nextUrl.searchParams,
  );
  const transactions = await findAll(user.sub, type, skip, take);
  return NextResponse.json(transactions);
});
