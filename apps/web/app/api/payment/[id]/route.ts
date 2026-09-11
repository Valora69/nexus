import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { updatePaymentSchema } from '@/lib/server/schemas/payment';
import { findOne, updatePayment, remove } from '@/lib/server/services/payment';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/payment/:id  [Auth]
 * Find a single payment by ID. Split owner or expense payee only.
 */
export const GET = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const payment = await findOne(id, user.sub);
  return NextResponse.json(payment);
});

/**
 * PATCH /api/payment/:id  [Auth]
 * Update a payment. Payee may set isVerified (verifiedAt auto-populated);
 * split owner may edit method/proof. Verified payments are immutable.
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
 * Delete a payment. Only the split owner, and only while unverified.
 */
export const DELETE = withAuth<Ctx>(async (_req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const deleted = await remove(id, user.sub);
  return NextResponse.json(deleted);
});
