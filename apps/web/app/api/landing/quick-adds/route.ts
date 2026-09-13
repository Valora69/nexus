import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  QUICK_ADDS_KEY,
  QUICK_ADD_MAX_BATCH,
  createPressLimiter,
} from '@/lib/landing/quick-adds';
import { prisma } from '@/lib/server/db';
import { toErrorResponse } from '@/lib/server/errors';
import { parseBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

const pressesSchema = z.object({
  presses: z.number().int().min(1).max(QUICK_ADD_MAX_BATCH),
});

const allow = createPressLimiter();

function visitorOf(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function readCount(): Promise<number> {
  const row = await prisma.landingCounter.findUnique({
    where: { key: QUICK_ADDS_KEY },
  });
  return Number(row?.count ?? 0);
}

/**
 * GET /api/landing/quick-adds  [Public]
 * The shared number of Quick Add presses on the landing page.
 */
export async function GET() {
  try {
    return NextResponse.json(
      { count: await readCount() },
      { headers: NO_STORE },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * POST /api/landing/quick-adds  [Public]
 * Add a batch of presses ({ presses: 1–50 }). Each visitor has a per-minute
 * budget; presses past it are dropped, and the response still carries the
 * current total so the pill stays in sync.
 */
export async function POST(req: NextRequest) {
  try {
    const { presses } = parseBody(
      pressesSchema,
      await req.json().catch(() => null),
    );
    const accepted = allow(visitorOf(req), presses, Date.now());
    let count: number;
    if (accepted > 0) {
      const row = await prisma.landingCounter.upsert({
        where: { key: QUICK_ADDS_KEY },
        create: { key: QUICK_ADDS_KEY, count: BigInt(accepted) },
        update: { count: { increment: BigInt(accepted) } },
      });
      count = Number(row.count);
    } else {
      count = await readCount();
    }
    return NextResponse.json({ count, accepted }, { headers: NO_STORE });
  } catch (error) {
    return toErrorResponse(error);
  }
}
