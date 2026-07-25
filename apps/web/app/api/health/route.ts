import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';

/**
 * GET /api/health
 *
 * Public health check — verifies the app is running and can reach the
 * database through the connection pooler. Mirrors the NestJS
 * `GET /api/health` endpoint.
 */
export async function GET() {
  try {
    // Quick DB connectivity check through the pooler.
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed — database unreachable:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database unreachable' },
      { status: 503 },
    );
  }
}
