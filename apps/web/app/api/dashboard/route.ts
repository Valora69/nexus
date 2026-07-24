import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { dashboardQuerySchema } from '@/lib/server/schemas/dashboard';
import { getDashboard } from '@/lib/server/services/dashboard';

/**
 * GET /api/dashboard  [Auth]
 * Returns the dashboard data for the authenticated user.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
  const { month } = parseQuery(dashboardQuerySchema, req.nextUrl.searchParams);
  const dashboard = await getDashboard(user.sub, month);
  return NextResponse.json(dashboard);
});
