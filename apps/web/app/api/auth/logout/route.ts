import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/server/auth';

/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie and returns a success message.
 * Matches the NestJS `POST /auth/logout` response shape.
 */
export async function POST() {
  const response = NextResponse.json({ message: 'Logout successful' });
  clearAuthCookie(response);
  return response;
}
