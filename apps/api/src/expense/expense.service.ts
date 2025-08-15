import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(ExpenseService.name, {
    timestamp: true,
  });

  async create(createExpenseDto: CreateExpenseDto) {
    const { groupId, userId, ...rest } = createExpenseDto;
    try {
      this.logger.log('Creating Expense...');
      const createdExpense = await this.prisma.expense.create({
        data: {
          ...(userId && {
            user: {
              connect: {
                id: userId,
              },
            },
          }),
          group: {
            connect: {
              id: groupId,
            },
          },
          ...rest,
        },
      });
      return createdExpense;
    } catch (error) {
      this.logger.error('Error creating expense');
      throw new InternalServerErrorException('Failed to create expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll(id: string) {
    this.logger.log('Retrieving Expenses...');
    try {
      const expenses = await this.prisma.expense.findMany({
        where: {
          userId: id,
        },
        include: {
          group: true,
          user: true,
        },
      });
      return expenses;
    } catch {
      this.logger.error('Error getting expenses');
      throw new InternalServerErrorException('Failed to fetch expenses');
    }
  }

  async findOne(id: string) {
    this.logger.log('Retrieving Expense...');
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
      });
      return expense;
    } catch (error) {
      this.logger.error('Failed to retrieve expense');
      throw new InternalServerErrorException('Failed to retrieve expense');
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id);
    this.logger.log('Updating expense...');
    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: updateExpenseDto,
      });
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to update expense');
      throw new InternalServerErrorException('Failed to update expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    this.logger.log('Removing expense...');
    await this.findOne(id);
    try {
      const deletedExpense = await this.prisma.expense.delete({
        where: { id },
      });
      return deletedExpense;
    } catch (error) {
      this.logger.log('Failed to delete expense');
      throw new InternalServerErrorException('Failed to delete expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async assignExpense(expenseId: string, userId: string) {
    this.logger.log('Assigning expense to user...');
    await this.findOne(expenseId);

    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          user: {
            connect: { id: userId },
          },
        },
        include: {
          user: true,
          group: true,
        },
      });

      this.logger.log(`Expense ${expenseId} assigned to user ${userId}`);
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to assign expense');
      throw new InternalServerErrorException('Failed to assign expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async reassignExpense(expenseId: string, newUserId: string) {
    this.logger.log('Reassigning expense to new user...');
    await this.findOne(expenseId);

    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          user: {
            connect: { id: newUserId },
          },
        },
        include: {
          user: true,
          group: true,
        },
      });

      this.logger.log(`Expense ${expenseId} reassigned to user ${newUserId}`);
      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to reassign expense');
      throw new InternalServerErrorException('Failed to reassign expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
