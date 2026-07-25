import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { prisma } from './db';

interface LogActivityInput {
  createdByUserId: string;
  activityName: ActivityNameEnum;
  activityOn: ActivityOnEnum;
  groupId: string;
}

/**
 * Write an activity log entry. Called after mutations succeed (outside
 * transactions). Matches the NestJS `@OnEvent('activity.created')` handler:
 * fire-and-forget, errors logged but never propagated.
 *
 * Awaited inline rather than using `waitUntil` — the insert is a single
 * row on an indexed table (≈5–15 ms), and swallowing ensures callers
 * never fail due to audit logging.
 */
export async function logActivity(data: LogActivityInput): Promise<void> {
  try {
    await prisma.activity.create({ data });
  } catch (error) {
    console.error('Failed to create activity (non-fatal):', error);
  }
}
