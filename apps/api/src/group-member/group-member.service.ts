import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';


@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}
  private readonly logger = new Logger(GroupMemberService.name, {
    timestamp: true,
  });
  async create(createGroupMemberDto: CreateGroupMemberDto, userId: string) {
    this.logger.log('Creating group member...');
    try {
      const existingMember = await this.prisma.groupMember.findUnique({
        where: {
          GroupMemberUnique: {
            userId: createGroupMemberDto.userId,
            groupId: createGroupMemberDto.groupId,
          },
        },
      });

      if (existingMember) {
        this.logger.error('User is already a member of this group');
        throw new HttpException(
          'User is already a member of this group',
          HttpStatus.CONFLICT,
        );
      }


      const createdMember = await this.prisma.groupMember.create({
        data: createGroupMemberDto,
        include: {
          user: true,
          group: true,
        },
      });

      if(createdMember ){
         this.eventEmitter.emit('activity.created', {
          groupId: createdMember.groupId,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: userId,
        });
      }

      this.logger.log('Group member created successfully');
      return createdMember;
    } catch (error) {
      this.logger.error('Error creating group member');
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create group member', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll() {
    this.logger.log('Retrieving all group members...');
    try {
      const allMembers = await this.prisma.groupMember.findMany({
        include: {
          user: true,
          group: true,
        },
      });
      return allMembers;
    } catch (error) {
      this.logger.error('Error fetching group members');
      throw new InternalServerErrorException('Failed to fetch group members');
    }
  }

  async findOne(id: string) {
    this.logger.log('Retrieving group member...');
    try {
      const member = await this.prisma.groupMember.findUnique({
        where: { id },
        include: {
          user: true,
          group: true,
        },
      });

      if (!member) {
        throw new HttpException('Group member not found', HttpStatus.NOT_FOUND);
      }

      return member;
    } catch (error) {
      this.logger.error('Failed to retrieve group member');
      throw new InternalServerErrorException('Failed to retrieve group member');
    }
  }

  async update(id: string, updateGroupMemberDto: UpdateGroupMemberDto, userId: string) {
  this.logger.log('Updating group member...');

  try {
    const existingMember = await this.findOne(id);

    if (updateGroupMemberDto.userId || updateGroupMemberDto.groupId) {
      const newUserId = updateGroupMemberDto.userId || existingMember.userId;
      const newGroupId = updateGroupMemberDto.groupId || existingMember.groupId;

      const duplicateMember = await this.prisma.groupMember.findUnique({
        where: {
          GroupMemberUnique: {
            userId: newUserId,
            groupId: newGroupId,
          },
        },
      });

      if (duplicateMember && duplicateMember.id !== id) {
        this.logger.error('User is already a member of this group');
        throw new HttpException(
          'User is already a member of this group',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatedMember = await this.prisma.groupMember.update({
      where: { id },
      data: updateGroupMemberDto,
      include: {
        user: true,
        group: true,
      },
    });

    if(updatedMember ){
         this.eventEmitter.emit('activity.created', {
          groupId: updatedMember.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: userId,
        });
      }


    this.logger.log(`Group member ${id} updated successfully`);
    return updatedMember;
  } catch (error) {
    this.logger.error('Failed to update group member');
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to update group member', {
      cause: error,
      description: 'An unexpected error occurred',
    });
  }
}

  /**
   * Returns a list of blocking reasons that prevent removing this member from
   * their group. Empty list = safe to remove.
   *
   * Blocks:
   *  1. Member has unsettled splits in the group (split.amount > sum of verified payments)
   *  2. Member is the payee on a group expense with any unsettled split owed by others
   *  3. Member has pending (unverified) payments on their splits in the group
   */
  async findRemovalBlockers(memberId: string) {
    const member = await this.findOne(memberId);
    const { userId, groupId } = member;

    const [ownSplits, owedToMember, pendingPayments] = await Promise.all([
      this.prisma.expenseSplit.findMany({
        where: { userId, expense: { groupId } },
        include: {
          payments: { where: { isVerified: true } },
          expense: { select: { id: true, name: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: { groupId, payeeId: userId },
        include: {
          splits: {
            where: { userId: { not: userId } },
            include: { payments: { where: { isVerified: true } } },
          },
        },
      }),
      this.prisma.payment.findMany({
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

  async remove(id: string, userId: string) {
    this.logger.log('Removing group member...');

    const { blockers } = await this.findRemovalBlockers(id);
    if (blockers.length > 0) {
      throw new HttpException(
        {
          message: 'Cannot remove member with unsettled group balances',
          blockers,
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const deletedMember = await this.prisma.groupMember.delete({
        where: { id },
      });

      if (deletedMember) {
        this.eventEmitter.emit('activity.created', {
          groupId: deletedMember.groupId,
          activityName: ActivityNameEnum.DELETED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: userId,
        });
      }
      return deletedMember;
    } catch (error) {
      this.logger.error('Failed to delete group member');
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete group member', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
