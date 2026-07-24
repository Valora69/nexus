import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { paymentQuerySchema } from '@/lib/server/schemas/payment';
import { findPendingVerification } from '@/lib/server/services/payment';

/**
 * GET /api/payment/pending-verification  [Auth]
 * Unverified payments where the authenticated user is the expense payee
 * and the payment was made by someone else.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { skip, take } = parseQuery(
    paymentQuerySchema,
    req.nextUrl.searchParams,
  );
  const payments = await findPendingVerification(user.sub, skip, take);
  return NextResponse.json(payments);
});
