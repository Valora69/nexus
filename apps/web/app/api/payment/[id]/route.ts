import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { updatePaymentSchema } from '@/lib/server/schemas/payment';
import { findOne, updatePayment, remove } from '@/lib/server/services/payment';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/payment/:id  [Auth]
 * Find a single payment by ID.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, _user) => {
  const { id } = await ctx.params;
  const payment = await findOne(id);
  return NextResponse.json(payment);
});

/**
 * PATCH /api/payment/:id  [Auth]
 * Update a payment. Allowed if user is split owner or expense payee.
 * When isVerified is set to true, verifiedAt is auto-populated.
 */
export const PATCH = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const dto = parseBody(updatePaymentSchema, body);
  const updated = await updatePayment(id, dto, user.sub);
  return NextResponse.json(updated);
});

/**
 * DELETE /api/payment/:id  [Auth]
 * Delete a payment. Only the split owner (who made the payment) can delete.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const deleted = await remove(id, user.sub);
  return NextResponse.json(deleted);
});
