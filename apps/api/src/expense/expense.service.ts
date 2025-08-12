import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    try {
      const createdExpense = await this.prisma.expense.create({
        data: createExpenseDto,
      });
      return createdExpense;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll() {
    try {
      return await this.prisma.expense.findMany({
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch expenses');
    }
  }

  async findOne(id: string) {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id },
      });
      if (!expense) {
        throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
      }
      return expense;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch expense');
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    await this.findOne(id);
    try {
      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: updateExpenseDto,
      });
      return updatedExpense;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      const deletedExpense = await this.prisma.expense.delete({
        where: { id },
      });
      return deletedExpense;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
