import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paymentQuerySchema } from '@/lib/server/schemas/payment';
import { findPendingConfirmation } from '@/lib/server/services/payment';

/**
 * GET /api/payment/pending-confirmation  [Auth]
 * Unverified payments where the authenticated user made the payment.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(
    paymentQuerySchema,
    req.nextUrl.searchParams,
  );
  const payments = await findPendingConfirmation(user.sub, skip, take);
  return NextResponse.json(payments);
});
