import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { markAsPaidSchema } from '@/lib/server/schemas/expense-split';
import { markAsPaid } from '@/lib/server/services/expense-split';
import { PaymentMethod } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/expense-splits/:id/mark-paid  [Auth]
 * Record a payment (full or partial) against an expense split.
 */
export const POST = withAuth<Ctx>(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const dto = parseBody(markAsPaidSchema, body);
  const result = await markAsPaid(
    id,
    user.sub,
    dto.paymentMethod as PaymentMethod,
    dto.amountPaid,
    dto.paymentProof,
  );
  return NextResponse.json(result);
});
