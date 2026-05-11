import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateExpenseSplitDto } from './dto/create-expense-split.dto';
import { UpdateExpenseSplitDto } from './dto/update-expense-split.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

const EXPENSE_SPLIT_INCLUDE = {
  user: { select: USER_SELECT },
  expense: {
    include: {
      group: true,
      payer: { select: USER_SELECT },
      payee: { select: USER_SELECT },
    },
  },
} as const;

@Injectable()
export class ExpenseSplitService {
  private readonly logger = new Logger(ExpenseSplitService.name, {
    timestamp: true,
  });

  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseSplitDto: CreateExpenseSplitDto) {
    this.logger.log('Creating expense split...');
    try {
      const split = await this.prisma.expenseSplit.create({
        data: createExpenseSplitDto,
        include: EXPENSE_SPLIT_INCLUDE,
      });
      return split;
    } catch (error) {
      this.logger.error('Failed to create expense split', error);
      throw new InternalServerErrorException('Failed to create expense split');
    }
  }

  async findAll() {
    this.logger.log('Retrieving all expense splits...');
    try {
      return await this.prisma.expenseSplit.findMany({
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch expense splits', error);
      throw new InternalServerErrorException('Failed to fetch expense splits');
    }
  }

  /**
   * Get all splits for the current user (what they owe)
   */
  async findMyPayables(userId: string) {
    this.logger.log(`Retrieving payable splits for user ${userId}...`);
    try {
      const splits = await this.prisma.expenseSplit.findMany({
        where: {
          userId,
          isPaid: false,
          // Exclude splits where user is the payee (they paid upfront)
          expense: {
            payeeId: {
              not: userId,
            },
          },
        },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      this.logger.log(
        `Found ${splits.length} payable splits for user ${userId}`,
      );
      return splits;
    } catch (error) {
      this.logger.error('Failed to fetch payable splits', error);
      throw new InternalServerErrorException('Failed to fetch payable splits');
    }
  }

  /**
   * Get all splits where others owe the current user (they are the payee on the expense)
   */
  async findMyReceivables(userId: string) {
    this.logger.log(`Retrieving receivable splits for user ${userId}...`);
    try {
      const splits = await this.prisma.expenseSplit.findMany({
        where: {
          isPaid: false,
          expense: {
            payeeId: userId,
          },
          userId: {
            not: userId, // Exclude user's own split
          },
        },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      this.logger.log(
        `Found ${splits.length} receivable splits for user ${userId}`,
      );
      return splits;
    } catch (error) {
      this.logger.error('Failed to fetch receivable splits', error);
      throw new InternalServerErrorException(
        'Failed to fetch receivable splits',
      );
    }
  }

  /**
   * Get splits by expense ID
   */
  async findByExpenseId(expenseId: string) {
    this.logger.log(`Retrieving splits for expense ${expenseId}...`);
    try {
      return await this.prisma.expenseSplit.findMany({
        where: { expenseId },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch splits by expense', error);
      throw new InternalServerErrorException(
        'Failed to fetch splits by expense',
      );
    }
  }

  /**
   * Get splits by user ID
   */
  async findByUserId(userId: string) {
    this.logger.log(`Retrieving splits for user ${userId}...`);
    try {
      return await this.prisma.expenseSplit.findMany({
        where: { userId },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch splits by user', error);
      throw new InternalServerErrorException('Failed to fetch splits by user');
    }
  }

  async findOne(id: string) {
    this.logger.log(`Retrieving expense split ${id}...`);
    try {
      const split = await this.prisma.expenseSplit.findUnique({
        where: { id },
        include: EXPENSE_SPLIT_INCLUDE,
      });
      if (!split) {
        throw new NotFoundException(`Expense split with ID ${id} not found`);
      }
      return split;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to fetch expense split', error);
      throw new InternalServerErrorException('Failed to fetch expense split');
    }
  }

  async update(id: string, updateExpenseSplitDto: UpdateExpenseSplitDto) {
    this.logger.log(`Updating expense split ${id}...`);
    await this.findOne(id);
    try {
      return await this.prisma.expenseSplit.update({
        where: { id },
        data: {
          ...updateExpenseSplitDto,
          ...(updateExpenseSplitDto.isPaid && { paidAt: new Date() }),
        },
        include: EXPENSE_SPLIT_INCLUDE,
      });
    } catch (error) {
      this.logger.error('Failed to update expense split', error);
      throw new InternalServerErrorException('Failed to update expense split');
    }
  }

  /**
   * Mark a split as paid and create a Payment record
   */
  async markAsPaid(
    id: string,
    userId: string,
    paymentMethod: PaymentMethod,
    paymentProof?: string,
  ) {
    this.logger.log(`Marking split ${id} as paid by user ${userId}...`);
    const split = await this.findOne(id);

    // Verify the user marking as paid is the one who owes
    if (split.userId !== userId) {
      throw new HttpException(
        'You can only mark your own splits as paid',
        HttpStatus.FORBIDDEN,
      );
    }

    if (split.isPaid) {
      throw new HttpException(
        'This split is already marked as paid',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Create payment record and update split in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the payment
        const payment = await tx.payment.create({
          data: {
            amountPaid: split.amount,
            paymentMethod,
            paymentProof,
            isVerified: false,
            expenseSplitId: id,
          },
        });

        // Update the split
        const updatedSplit = await tx.expenseSplit.update({
          where: { id },
          data: {
            isPaid: true,
            paidAt: new Date(),
          },
          include: EXPENSE_SPLIT_INCLUDE,
        });

        return { payment, split: updatedSplit };
      });

      this.logger.log(
        `Split ${id} marked as paid, payment ${result.payment.id} created`,
      );
      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Error marking split as paid', error);
      throw new InternalServerErrorException('Failed to mark split as paid', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    this.logger.log(`Removing expense split ${id}...`);
    await this.findOne(id);
    try {
      return await this.prisma.expenseSplit.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error('Failed to delete expense split', error);
      throw new InternalServerErrorException('Failed to delete expense split');
    }
  }
}
