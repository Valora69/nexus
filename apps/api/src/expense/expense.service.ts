import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateExpenseDto,
  CreateManyExpensesDto,
} from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
    const { groupId, payeeId, payerId, ...rest } = createExpenseDto;
    this.logger.log('Creating expense...');
    const expenseData = {
      createdByUserId: userId,
      activityName: ActivityNameEnum.CREATED,
      activityOn: ActivityOnEnum.EXPENSE,
      groupId: groupId,
    };

    try {
      await this.validateGroupExists(groupId);
      if (userId) {
        await Promise.all([
          this.validateUserExists(userId),
          this.validateGroupMembership(userId, groupId),
        ]);
      }

      const createdExpense = await this.prisma.expense.create({
        data: {
          payee: {
            connect: {
              id: payeeId,
            },
          },
          payer: {
            connect: {
              id: payerId,
            },
          },
          group: {
            connect: {
              id: groupId,
            },
          },
          ...rest,
        },
      });

      if (createdExpense) {
        this.eventEmitter.emit('activity.created', expenseData);
      }

      this.logger.log(
        `Expense created successfully with id: ${createdExpense.id}`,
      );
      return createdExpense;
    } catch (error) {
      this.logger.error('Error creating expense', error);
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
      const createdExpenses = await Promise.all(
        expenses.map((expenseDto) => this.create(expenseDto, userId)),
      );

      if (createdExpenses.length > 0) {
        this.eventEmitter.emit('activity.created', {
          groupId: createdExpenses[0].groupId, // Using first expense's groupId
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.EXPENSE,
          createdByUserId: userId,
        });
      }

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

  async findAll(userId?: string) {
    this.logger.log('Retrieving Expenses...');
    try {
      const expenses = await this.prisma.expense.findMany({
        ...(userId && {
          where: {
            OR: [{ payeeId: userId }, { payerId: userId }],
          },
        }),
        include: {
          group: true,
          payee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return expenses;
    } catch (error) {
      this.logger.error('Error getting expenses');
      throw new InternalServerErrorException('Failed to fetch expenses');
    }
  }

  async findAllPayables(userId: string) {
    this.logger.log(`Retrieving payable expenses for user ${userId}...`);
    try {
      const payableExpenses = await this.prisma.expense.findMany({
        where: {
          payerId: userId,
        },
        include: {
          group: true,
          payee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${payableExpenses.length} payable expenses for user ${userId}`,
      );
      return payableExpenses;
    } catch (error) {
      this.logger.error('Error getting payable expenses');
      throw new InternalServerErrorException(
        'Failed to fetch payable expenses',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findAllReceivables(userId: string) {
    this.logger.log(`Retrieving receivable expenses for user ${userId}...`);
    try {
      const receivableExpenses = await this.prisma.expense.findMany({
        where: {
          payeeId: userId,
        },
        include: {
          group: true,
          payee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${receivableExpenses.length} receivable expenses for user ${userId}`,
      );
      return receivableExpenses;
    } catch (error) {
      this.logger.error('Error getting receivable expenses');
      throw new InternalServerErrorException(
        'Failed to fetch receivable expenses',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findOne(id: string) {
    this.logger.log('Retrieving Expense...');
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
        include: {
          group: true,
          payee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
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
      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: updateExpenseDto,
      });

      if (updatedExpense) {
        this.eventEmitter.emit('activity.created', {
          groupId: updatedExpense.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.EXPENSE,
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

  async assignPayee(expenseId: string, newUserId: string, userId: string) {
    this.logger.log('Reassigning expense payee to new user...');
    await this.findOne(expenseId);

    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          payee: {
            connect: { id: newUserId },
          },
        },
      });

      if (updatedExpense) {
        this.eventEmitter.emit('activity.created', {
          groupId: updatedExpense.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.EXPENSE_PAYEE,
          createdByUserId: userId,
        });
      }

      this.logger.log(
        `Expense Payee ${expenseId} reassigned to user ${newUserId}`,
      );
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to reassign expense payee');
      throw new InternalServerErrorException(
        'Failed to reassign expense payee',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async assignPayer(expenseId: string, newUserId: string, userId: string) {
    this.logger.log('Reassigning expense payer to new user...');
    await this.findOne(expenseId);

    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          payer: {
            connect: { id: newUserId },
          },
        },
      });

      if (updatedExpense) {
        this.eventEmitter.emit('activity.created', {
          groupId: updatedExpense.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.EXPENSE_PAYER,
          createdByUserId: userId,
        });
      }

      this.logger.log(
        `Expense ${expenseId} payer reassigned to user ${newUserId}`,
      );
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to reassign expense payer');
      throw new InternalServerErrorException(
        'Failed to reassign expense payer',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }
}
