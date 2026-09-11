import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import { readIdempotencyKey } from '@/lib/server/idempotency';
import {
  createPaymentSchema,
  paymentQuerySchema,
} from '@/lib/server/schemas/payment';
import { create, findAll } from '@/lib/server/services/payment';

/**
 * POST /api/payment  [Auth]
 * Create a new payment against an expense split. Optional `Idempotency-Key`
 * header (mobile-offline outbox) makes replays return the previously-created
 * payment rather than double-writing against the split balance.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createPaymentSchema, body);
  const clientRequestId = readIdempotencyKey(req);
  const { payment } = await create(dto, user.sub, clientRequestId);
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
