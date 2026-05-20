import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(
    private readonly prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}
  private readonly logger = new Logger(GroupService.name, {
    timestamp: true,
  });

  async create(createGroupDto: CreateGroupDto, userId: string) {
    this.logger.log('Creating group...');

    const { memberIds, ...groupData } = createGroupDto;

    try {
      const createdGroup = await this.prisma.$transaction(async (prisma) => {
        const group = await prisma.group.create({
          data: {
            createdBy: { connect: { id: userId } },
            ...groupData,
          },
          // Slim response — write returns id+name+description+createdByUserId only.
          // Frontend invalidates queries and refetches the list anyway.
          select: {
            id: true,
            name: true,
            description: true,
            createdByUserId: true,
            createdAt: true,
          },
        });

        // Always add the creator as the first member
        await prisma.groupMember.create({
          data: { groupId: group.id, userId },
        });

        // Add any additional members, skipping the creator if accidentally included
        const extraIds = (memberIds ?? []).filter((id) => id !== userId);
        if (extraIds.length > 0) {
          await prisma.groupMember.createMany({
            data: extraIds.map((id) => ({ groupId: group.id, userId: id })),
            skipDuplicates: true,
          });
        }

        return group;
      });

      if (createdGroup) {
        const groupData = {
          groupId: createdGroup.id,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.GROUP_DETAILS,
          createdByUserId: userId,
        };
        this.eventEmitter.emit('activity.created', groupData);
      }

      this.logger.log(`Group created successfully with id: ${createdGroup.id}`);
      return createdGroup;
    } catch (error) {
      this.logger.error('Error creating group', error);
      throw new InternalServerErrorException('Failed to create group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll(userId: string, skip?: number, take?: number) {
    this.logger.log('Retrieving groups for user...');
    try {
      const groups = await this.prisma.group.findMany({
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
        // Groups are small in count, but cap to be safe against unbounded loads.
        take: Math.min(take ?? 50, 100),
      });

      this.logger.log(`Found ${groups.length} groups for user ${userId}`);
      return groups;
    } catch (error) {
      this.logger.error('Error fetching groups for user');
      throw new InternalServerErrorException('Failed to fetch groups', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.group.findUnique({
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
      throw new InternalServerErrorException('Failed to fetch group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async update(id: string, updateGroupDto: UpdateGroupDto, userId: string) {
    try {
      const { memberIds: _memberIds, ...groupData } = updateGroupDto;
      const updatedGroup = await this.prisma.group.update({
        where: { id },
        data: groupData,
        select: { id: true, name: true, description: true },
      });

      if (updatedGroup) {
        this.eventEmitter.emit('activity.created', {
          groupId: updatedGroup.id,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.GROUP_DETAILS,
          createdByUserId: userId,
        });
      }

      return updatedGroup;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    // Block deletion if any split in the group still has an unsettled balance,
    // or any unverified payment exists. Cascade would otherwise wipe live
    // financial obligations silently.
    const unsettledSplits = await this.prisma.expenseSplit.findMany({
      where: { expense: { groupId: id } },
      include: { payments: { where: { isVerified: true } } },
    });

    const hasUnsettled = unsettledSplits.some((s) => {
      const paid = s.payments.reduce((acc, p) => acc + p.amountPaid, 0);
      return s.amount - paid > 0.01;
    });
    if (hasUnsettled) {
      throw new HttpException(
        'Cannot delete group: unsettled balances exist between members. Settle all expenses first.',
        HttpStatus.CONFLICT,
      );
    }

    const pendingPayments = await this.prisma.payment.count({
      where: {
        isVerified: false,
        expenseSplit: { expense: { groupId: id } },
      },
    });
    if (pendingPayments > 0) {
      throw new HttpException(
        'Cannot delete group: unverified payments still pending. Resolve them first.',
        HttpStatus.CONFLICT,
      );
    }

    try {
      // Group → Expense and Group → Activity have no onDelete cascade in the
      // schema (defaults to RESTRICT). We delete dependent rows first inside
      // a transaction so the final group.delete cannot trip FK violations.
      // Expense deletion cascades to ExpenseSplit → Payment, and SetNulls
      // PersonalTransaction.expenseSplitId (ledger rows retained).
      const deletedGroup = await this.prisma.$transaction(async (tx) => {
        await tx.activity.deleteMany({ where: { groupId: id } });
        await tx.expense.deleteMany({ where: { groupId: id } });
        return tx.group.delete({ where: { id } });
      });

      this.eventEmitter.emit('activity.created', {
        groupId: deletedGroup.id,
        activityName: ActivityNameEnum.DELETED,
        activityOn: ActivityOnEnum.GROUP_DETAILS,
        createdByUserId: userId,
      });

      return deletedGroup;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to delete group', error);
      throw new InternalServerErrorException('Failed to delete group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
