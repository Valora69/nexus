import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { logActivity } from '@/lib/server/activity';
import type { CreateGroupMemberInput } from '@/lib/server/schemas/group-member';

export async function createGroupMember(
  dto: CreateGroupMemberInput,
  userId: string,
) {
  try {
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        GroupMemberUnique: {
          userId: dto.userId,
          groupId: dto.groupId,
        },
      },
    });

    if (existingMember) {
      throw new ApiError(409, 'User is already a member of this group');
    }

    const createdMember = await prisma.groupMember.create({
      data: dto,
      include: {
        user: true,
        group: true,
      },
    });

    if (createdMember) {
      await logActivity({
        groupId: createdMember.groupId,
        activityName: ActivityNameEnum.CREATED,
        activityOn: ActivityOnEnum.GROUP_MEMBER,
        createdByUserId: userId,
      });
    }

    return createdMember;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Error creating group member:', error);
    throw new ApiError(500, 'Failed to create group member');
  }
}

export async function findAllGroupMembers() {
  try {
    const allMembers = await prisma.groupMember.findMany({
      include: {
        user: true,
        group: true,
      },
    });
    return allMembers;
  } catch (error) {
    console.error('Error fetching group members:', error);
    throw new ApiError(500, 'Failed to fetch group members');
  }
}

export async function findOneGroupMember(id: string) {
  try {
    const member = await prisma.groupMember.findUnique({
      where: { id },
      include: {
        user: true,
        group: true,
      },
    });

    if (!member) {
      throw new ApiError(404, 'Group member not found');
    }

    return member;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to retrieve group member:', error);
    throw new ApiError(500, 'Failed to retrieve group member');
  }
}

export async function findRemovalBlockers(memberId: string) {
  const member = await findOneGroupMember(memberId);
  const { userId, groupId } = member;

  const [ownSplits, owedToMember, pendingPayments] = await Promise.all([
    prisma.expenseSplit.findMany({
      where: { userId, expense: { groupId } },
      include: {
        payments: { where: { isVerified: true } },
        expense: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.findMany({
      where: { groupId, payeeId: userId },
      include: {
        splits: {
          where: { userId: { not: userId } },
          include: { payments: { where: { isVerified: true } } },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        isVerified: false,
        expenseSplit: { userId, expense: { groupId } },
      },
      include: {
        expenseSplit: {
          select: { expense: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const blockers: Array<{ type: string; message: string }> = [];

  for (const split of ownSplits) {
    const paid = split.payments.reduce((s, p) => s + p.amountPaid, 0);
    const remaining = split.amount - paid;
    if (remaining > 0.01) {
      blockers.push({
        type: 'UNSETTLED_DEBT',
        message: `Owes $${remaining.toFixed(2)} on "${split.expense.name}"`,
      });
    }
  }

  for (const expense of owedToMember) {
    for (const split of expense.splits) {
      const paid = split.payments.reduce((s, p) => s + p.amountPaid, 0);
      const remaining = split.amount - paid;
      if (remaining > 0.01) {
        blockers.push({
          type: 'OUTSTANDING_RECEIVABLE',
          message: `Is owed $${remaining.toFixed(2)} on "${expense.name}"`,
        });
      }
    }
  }

  for (const payment of pendingPayments) {
    blockers.push({
      type: 'PENDING_PAYMENT',
      message: `Has an unverified payment on "${payment.expenseSplit.expense.name}"`,
    });
  }

  return { member, blockers };
}

export async function removeGroupMember(id: string, userId: string) {
  const { blockers } = await findRemovalBlockers(id);
  if (blockers.length > 0) {
    return { blocked: true as const, blockers };
  }

  try {
    const deletedMember = await prisma.groupMember.delete({
      where: { id },
    });

    if (deletedMember) {
      await logActivity({
        groupId: deletedMember.groupId,
        activityName: ActivityNameEnum.DELETED,
        activityOn: ActivityOnEnum.GROUP_MEMBER,
        createdByUserId: userId,
      });
    }

    return { blocked: false as const, member: deletedMember };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Failed to delete group member:', error);
    throw new ApiError(500, 'Failed to delete group member');
  }
}
