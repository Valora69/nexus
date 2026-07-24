import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth';
import { parseBody, parseQuery } from '@/lib/server/validation';
import {
  createActivitySchema,
  activityQuerySchema,
} from '@/lib/server/schemas/activity';
import {
  createActivity,
  findAllActivities,
} from '@/lib/server/services/activity-crud';

/**
 * POST /api/activity  [Auth]
 * Create an activity entry. Uses req.user.sub as createdByUserId.
 */
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const body = await req.json();
  const dto = parseBody(createActivitySchema, {
    ...body,
    createdByUserId: user.sub,
  });
  await createActivity(dto);
  return NextResponse.json(dto);
});

/**
 * GET /api/activity  [Auth]
 * List activities with optional skip/take pagination.
 */
export const GET = withAuth(async (req: NextRequest, _ctx, _user) => {
  const { skip, take } = parseQuery(
    activityQuerySchema,
    req.nextUrl.searchParams,
  );
  const activities = await findAllActivities(skip, take);
  return NextResponse.json(activities);
});
