import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody } from '@/lib/server/validation';
import { quickCaptureInputSchema } from '@/lib/server/schemas/personal-transaction';
import { quickCapture } from '@/lib/server/services/personal-transaction';

/**
 * POST /api/personal-transactions/quick-capture  [Auth]
 * Parse freeform text into a personal transaction.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const { input } = parseBody(quickCaptureInputSchema, body);
  const transaction = await quickCapture(input, user.sub);
  return NextResponse.json(transaction);
});
