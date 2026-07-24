import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import {
  createPaymentSchema,
  paymentQuerySchema,
} from '@/lib/server/schemas/payment';
import { create, findAll } from '@/lib/server/services/payment';

/**
 * POST /api/payment  [Auth]
 * Create a new payment against an expense split.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createPaymentSchema, body);
  const payment = await create(dto, user.sub);
  return NextResponse.json(payment);
});

/**
 * GET /api/payment  [Auth]
 * List payments scoped to the authenticated user (split owner or expense payer).
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(
    paymentQuerySchema,
    req.nextUrl.searchParams,
  );
  const payments = await findAll(user.sub, skip, take);
  return NextResponse.json(payments);
});
