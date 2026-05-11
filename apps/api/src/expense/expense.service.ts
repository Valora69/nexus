import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  CreateExpenseDto,
  CreateManyExpensesDto,
} from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityNameEnum, ActivityOnEnum, PersonalTransactionType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Shared select for user fields to avoid duplication
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

// Shared include for expense relations
const EXPENSE_INCLUDE = {
  group: true,
  payer: { select: USER_SELECT },
  payee: { select: USER_SELECT },
  splits: {
    include: {
      user: { select: USER_SELECT },
    },
  },
} as const;

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  private readonly logger = new Logger(ExpenseService.name, {
    timestamp: true,
  });

  // @TODO: Move to separate class
  private async validateGroupExists(groupId: string) {
    this.logger.log('Validating Group...');
    try {
      const group = await this.prisma.group.findUnique({
        where: { id: groupId },
      });
      return group;
    } catch (error) {
      this.logger.error(`Failed to validate group existence`);
      throw new InternalServerErrorException('Failed to validate group');
    }
  }

  // @TODO: Move to separate class
  private async validateUserExists(userId: string) {
    this.logger.log('Validating User...');
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      this.logger.error(`Failed to validate user`);
      throw new InternalServerErrorException('Failed to validate user');
    }
  }

  // @TODO: Move to separate class
  private async validateGroupMembership(userId: string, groupId: string) {
    this.logger.log('Validating Group Membership...');
    try {
      const member = await this.prisma.groupMember.findUnique({
        where: {
          GroupMemberUnique: {
            userId,
            groupId,
          },
        },
      });
      return member;
    } catch (error) {
      this.logger.error(`Failed to validate group membership`);
      throw new InternalServerErrorException(
        'Failed to validate group membership',
      );
    }
  }

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    const { groupId, payeeId, payerId, splits, ...rest } = createExpenseDto;
    this.logger.log('Creating expense...');

    try {
      await this.validateGroupExists(groupId);
      if (userId) {
        await Promise.all([
          this.validateUserExists(userId),
          this.validateGroupMembership(userId, groupId),
        ]);
      }

      // Validate splits if provided
      if (splits && splits.length > 0) {
        const totalSplitAmount = splits.reduce(
          (sum, split) => sum + split.amount,
          0,
        );
        if (Math.abs(totalSplitAmount - rest.totalAmount) > 0.01) {
          throw new HttpException(
            'Split amounts must equal total expense amount',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Validate all split users are group members
        await Promise.all(
          splits.map((split) =>
            this.validateGroupMembership(split.userId, groupId),
          ),
        );
      }

      const createdExpense = await this.prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            payer: { connect: { id: payerId } },
            ...(payeeId && { payee: { connect: { id: payeeId } } }),
            group: { connect: { id: groupId } },
            ...(splits &&
              splits.length > 0 && {
                splits: {
                  create: splits.map((split) => ({
                    user: { connect: { id: split.userId } },
                    amount: split.amount,
                    isPaid: split.isPaid || false,
                  })),
                },
              }),
            ...rest,
          },
          include: EXPENSE_INCLUDE,
        });

        // Auto-create a PersonalTransaction ledger entry for each split participant
        if (expense.splits && expense.splits.length > 0) {
          await tx.personalTransaction.createMany({
            data: expense.splits.map((split) => ({
              userId: split.userId,
              type: PersonalTransactionType.EXPENSE,
              amount: split.amount,
              description: expense.name,
              category: expense.group.name,
              isFromGroup: true,
              expenseSplitId: split.id,
              date: expense.date,
            })),
          });
        }

        return expense;
      });

      if (createdExpense) {
        this.eventEmitter.emit('activity.created', {
          createdByUserId: userId,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.EXPENSE,
          groupId: groupId,
        });
      }

      this.logger.log(
        `Expense created successfully with id: ${createdExpense.id}${splits ? ` and ${splits.length} splits` : ''}`,
      );
      return createdExpense;
    } catch (error) {
      this.logger.error('Error creating expense', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async createMany(
    createManyExpensesDto: CreateManyExpensesDto,
    userId: string,
  ) {
    this.logger.log('Creating multiple expenses...');
    const { expenses } = createManyExpensesDto;
    try {
      // Each create() call already emits its own activity event,
      // so we don't emit an additional one here.
      const createdExpenses = await Promise.all(
        expenses.map((expenseDto) => this.create(expenseDto, userId)),
      );

      this.logger.log(
        `Created ${createdExpenses.length} expenses successfully`,
      );
      return createdExpenses;
    } catch (error) {
      this.logger.error('Error creating multiple expenses', error);
      throw new InternalServerErrorException('Failed to create expenses', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll(userId?: string, type?: 'payable' | 'receivable', groupId?: string, skip?: number, take?: number) {
    this.logger.log('Retrieving Expenses...');
    try {
      let whereClause: Record<string, unknown> = {};

      if (userId) {
        switch (type) {
          case 'payable':
            whereClause = { payerId: userId };
            break;
          case 'receivable':
            whereClause = { payeeId: userId };
            break;
          default:
            whereClause = {
              OR: [
                { payeeId: userId },
                { payerId: userId },
                { splits: { some: { userId } } },
              ],
            };
            break;
        }
      }

      if (groupId) {
        whereClause = { ...whereClause, groupId };
      }

      const expenses = await this.prisma.expense.findMany({
        where: whereClause,
        include: EXPENSE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      });
      return expenses;
    } catch (error) {
      this.logger.error('Error getting expenses');
      throw new InternalServerErrorException('Failed to fetch expenses');
    }
  }

  async findOne(id: string) {
    this.logger.log('Retrieving Expense...');
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        include: EXPENSE_INCLUDE,
      });
      return expense;
    } catch (error) {
      this.logger.error('Failed to retrieve expense');
      throw new InternalServerErrorException('Failed to retrieve expense');
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, userId: string) {
    await this.findOne(id);
    this.logger.log('Updating expense...');
    try {
      const { splits: _splits, payeeId, payerId, groupId, ...expenseData } =
        updateExpenseDto;

      // Build the update data with proper relation handling
      const updateData: any = { ...expenseData };

      // Handle payer relation change
      if (payerId) {
        updateData.payer = { connect: { id: payerId } };
      }

      // Handle payee relation change
      if (payeeId) {
        updateData.payee = { connect: { id: payeeId } };
      }

      // Handle group relation change
      if (groupId) {
        updateData.group = { connect: { id: groupId } };
      }

      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: updateData,
        include: EXPENSE_INCLUDE,
      });

      if (updatedExpense) {
        // Determine the most specific activity type
        let activityOn: ActivityOnEnum = ActivityOnEnum.EXPENSE;
        if (payeeId && !payerId) {
          activityOn = ActivityOnEnum.EXPENSE_PAYEE;
        } else if (payerId && !payeeId) {
          activityOn = ActivityOnEnum.EXPENSE_PAYER;
        }

        this.eventEmitter.emit('activity.created', {
          groupId: updatedExpense.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn,
          createdByUserId: userId,
        });
      }
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to update expense');
      throw new InternalServerErrorException('Failed to update expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log('Removing expense...');
    await this.findOne(id);
    try {
      const deletedExpense = await this.prisma.expense.delete({
        where: { id },
      });

      if (deletedExpense) {
        this.eventEmitter.emit('activity.created', {
          groupId: deletedExpense.groupId,
          activityName: ActivityNameEnum.DELETED,
          activityOn: ActivityOnEnum.EXPENSE,
          createdByUserId: userId,
        });
      }
      return deletedExpense;
    } catch (error) {
      this.logger.log('Failed to delete expense');
      throw new InternalServerErrorException('Failed to delete expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
