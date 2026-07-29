import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signToken } from '@/lib/server/auth';
import { consumeAuthCode } from '@/lib/server/mobile-auth';
import { prisma } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  code: z.string().min(1),
  code_verifier: z.string().min(1),
});

/**
 * POST /api/auth/mobile/exchange
 *
 * Exchanges a one-time auth code (from the `moneyapp://auth?code=` deep link)
 * plus the PKCE `code_verifier` for a JWT. The code is validated, PKCE-checked,
 * and consumed (single-use) inside `consumeAuthCode`.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return invalid();
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return invalid();

  const userId = await consumeAuthCode(
    parsed.data.code,
    parsed.data.code_verifier,
  );
  if (!userId) return invalid();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
      { status: 404 },
    );
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture ?? undefined,
  });

  return NextResponse.json({ access_token: token });
}

function invalid() {
  return NextResponse.json(
    { error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } },
    { status: 400 },
  );
}
