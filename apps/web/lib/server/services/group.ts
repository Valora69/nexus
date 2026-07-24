import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { logActivity } from '@/lib/server/activity';
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from '@/lib/server/schemas/group';

export async function createGroup(dto: CreateGroupInput, userId: string) {
  const { memberIds, ...groupData } = dto;

  try {
    const createdGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          createdBy: { connect: { id: userId } },
          ...groupData,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdByUserId: true,
          createdAt: true,
        },
      });

      // Always add the creator as the first member
      await tx.groupMember.create({
        data: { groupId: group.id, userId },
      });

      // Add any additional members, skipping the creator if accidentally included
      const extraIds = (memberIds ?? []).filter((id) => id !== userId);
      if (extraIds.length > 0) {
        await tx.groupMember.createMany({
          data: extraIds.map((id) => ({ groupId: group.id, userId: id })),
          skipDuplicates: true,
        });
      }

      return group;
    });

    if (createdGroup) {
      await logActivity({
        groupId: createdGroup.id,
        activityName: ActivityNameEnum.CREATED,
        activityOn: ActivityOnEnum.GROUP_DETAILS,
        createdByUserId: userId,
      });
    }

    return createdGroup;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error creating group', error);
    throw new ApiError(500, 'Failed to create group');
  }
}

export async function findAllGroups(
  userId: string,
  skip?: number,
  take?: number,
) {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });

    return groups;
  } catch (error) {
    console.error('Error fetching groups for user', error);
    throw new ApiError(500, 'Failed to fetch groups');
  }
}

export async function findOneGroup(id: string) {
  try {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        expenses: {
          select: {
            id: true,
            name: true,
            totalAmount: true,
            date: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch group', error);
    throw new ApiError(500, 'Failed to fetch group');
  }
}

export async function updateGroup(
  id: string,
  dto: UpdateGroupInput,
  userId: string,
) {
  try {
    const { memberIds: _memberIds, ...groupData } = dto;
    const updatedGroup = await prisma.group.update({
      where: { id },
      data: groupData,
      select: { id: true, name: true, description: true },
    });

    if (updatedGroup) {
      await logActivity({
        groupId: updatedGroup.id,
        activityName: ActivityNameEnum.UPDATED,
        activityOn: ActivityOnEnum.GROUP_DETAILS,
        createdByUserId: userId,
      });
    }

    return updatedGroup;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to update group', error);
    throw new ApiError(500, 'Failed to update group');
  }
}

export async function removeGroup(id: string, userId: string) {
  const unsettledSplits = await prisma.expenseSplit.findMany({
    where: { expense: { groupId: id } },
    include: { payments: { where: { isVerified: true } } },
  });

  const hasUnsettled = unsettledSplits.some((s) => {
    const paid = s.payments.reduce((acc, p) => acc + p.amountPaid, 0);
    return s.amount - paid > 0.01;
  });
  if (hasUnsettled) {
    throw new ApiError(
      409,
      'Cannot delete group: unsettled balances exist between members. Settle all expenses first.',
    );
  }

  const pendingPayments = await prisma.payment.count({
    where: {
      isVerified: false,
      expenseSplit: { expense: { groupId: id } },
    },
  });
  if (pendingPayments > 0) {
    throw new ApiError(
      409,
      'Cannot delete group: unverified payments still pending. Resolve them first.',
    );
  }

  try {
    const deletedGroup = await prisma.$transaction(async (tx) => {
      await tx.activity.deleteMany({ where: { groupId: id } });
      await tx.expense.deleteMany({ where: { groupId: id } });
      return tx.group.delete({ where: { id } });
    });

    await logActivity({
      groupId: deletedGroup.id,
      activityName: ActivityNameEnum.DELETED,
      activityOn: ActivityOnEnum.GROUP_DETAILS,
      createdByUserId: userId,
    });

    return deletedGroup;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to delete group', error);
    throw new ApiError(500, 'Failed to delete group');
  }
}
