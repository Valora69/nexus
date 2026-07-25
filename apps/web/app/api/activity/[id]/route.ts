import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseQuery } from '@/lib/server/validation';
import { activityQuerySchema } from '@/lib/server/schemas/activity';
import { findAllActivitiesByGroup } from '@/lib/server/services/activity-crud';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/activity/:id  [Auth]
 * List activities for a group (id = groupId).
 */
export const GET = withAuth<Ctx>(async (req: NextRequest, ctx, _user) => {
  const { id } = await ctx.params;
  const { skip, take } = parseQuery(
    activityQuerySchema,
    req.nextUrl.searchParams,
  );
  const activities = await findAllActivitiesByGroup(id, skip, take);
  return NextResponse.json(activities);
});
