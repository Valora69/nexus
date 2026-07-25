import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import type { CreateActivityInput } from '@/lib/server/schemas/activity';

export async function createActivity(dto: CreateActivityInput) {
  try {
    await prisma.activity.create({
      data: {
        createdByUserId: dto.createdByUserId,
        activityName: dto.activityName,
        activityOn: dto.activityOn,
        groupId: dto.groupId,
      },
    });
  } catch (error) {
    console.error('Failed to create activity (non-fatal)', error);
  }
}

export async function findAllActivities(skip?: number, take?: number) {
  try {
    return await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    throw new ApiError(500, message);
  }
}

export async function findAllActivitiesByGroup(
  id: string,
  skip?: number,
  take?: number,
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!group) {
      throw new ApiError(404, 'Group not found');
    }

    return await prisma.activity.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    throw new ApiError(500, message);
  }
}
