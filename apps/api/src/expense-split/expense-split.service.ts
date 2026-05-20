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

// READ include for endpoints that render full split details (modals, lists).
// `group: true` replaced with explicit select — frontend only needs id+name.
const EXPENSE_SPLIT_INCLUDE = {
  user: { select: USER_SELECT },
  expense: {
    include: {
      group: { select: { id: true, name: true } },
      payer: { select: USER_SELECT },
      payee: { select: USER_SELECT },
    },
  },
  payments: true,
} as const;

// WRITE select for create/update mutations whose response the frontend types
// as `unknown`. Avoids hydrating the full nested tree just to return it.
const EXPENSE_SPLIT_WRITE_SELECT = {
  id: true,
  expenseId: true,
  userId: true,
  amount: true,
} as const;

// Two views of "settled":
//  - claimedTotal: sum of ALL payments (verified + pending). Used to decide if
//    the payer has more to claim — prevents overpayment in the pay modal.
//  - verifiedTotal: sum of verified payments only. Authoritative balance for
//    the receiver and the dashboard.
function sumPayments(
  payments: Array<{ amountPaid: number; isVerified: boolean }>,
  verifiedOnly = false,
): number {
  return payments.reduce(
    (acc, p) => acc + (verifiedOnly && !p.isVerified ? 0 : p.amountPaid),
    0,
  );
}

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
        select: EXPENSE_SPLIT_WRITE_SELECT,
      });
      return split;
    } catch (error) {
      this.logger.error('Failed to create expense split', error);
      throw new InternalServerErrorException('Failed to create expense split');
    }
  }

  async findAll(skip?: number, take?: number) {
    this.logger.log('Retrieving all expense splits...');
    try {
      return await this.prisma.expenseSplit.findMany({
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      this.logger.error('Failed to fetch expense splits', error);
      throw new InternalServerErrorException('Failed to fetch expense splits');
    }
  }

  /**
   * Get all splits the user still owes on. A split disappears once the payer
   * has claimed payment for the full amount (verified + pending), because no
   * further payment action is possible from their side.
   */
  async findMyPayables(userId: string, skip?: number, take?: number) {
    this.logger.log(`Retrieving payable splits for user ${userId}...`);
    try {
      const splits = await this.prisma.expenseSplit.findMany({
        where: {
          userId,
          expense: {
            payeeId: { not: userId },
          },
        },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
      const active = splits.filter(
        (s) => s.amount - sumPayments(s.payments, false) > 0.01,
      );
      this.logger.log(
        `Found ${active.length} active payable splits for user ${userId} (of ${splits.length})`,
      );
      return active;
    } catch (error) {
      this.logger.error('Failed to fetch payable splits', error);
      throw new InternalServerErrorException('Failed to fetch payable splits');
    }
  }

  /**
   * Get all splits where others still owe the current user. Uses verified
   * totals only (authoritative balance) — pending unverified payments stay
   * visible here until the receiver verifies them.
   */
  async findMyReceivables(userId: string, skip?: number, take?: number) {
    this.logger.log(`Retrieving receivable splits for user ${userId}...`);
    try {
      const splits = await this.prisma.expenseSplit.findMany({
        where: {
          expense: { payeeId: userId },
          userId: { not: userId },
        },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
      const active = splits.filter(
        (s) => s.amount - sumPayments(s.payments, true) > 0.01,
      );
      this.logger.log(
        `Found ${active.length} active receivable splits for user ${userId} (of ${splits.length})`,
      );
      return active;
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
  async findByExpenseId(expenseId: string, skip?: number, take?: number) {
    this.logger.log(`Retrieving splits for expense ${expenseId}...`);
    try {
      return await this.prisma.expenseSplit.findMany({
        where: { expenseId },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
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
  async findByUserId(userId: string, skip?: number, take?: number) {
    this.logger.log(`Retrieving splits for user ${userId}...`);
    try {
      return await this.prisma.expenseSplit.findMany({
        where: { userId },
        include: EXPENSE_SPLIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
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
    // Existence check via direct lookup (no full include) — cheaper than findOne.
    const exists = await this.prisma.expenseSplit.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Expense split with ID ${id} not found`);
    }
    try {
      return await this.prisma.expenseSplit.update({
        where: { id },
        data: updateExpenseSplitDto,
        select: EXPENSE_SPLIT_WRITE_SELECT,
      });
    } catch (error) {
      this.logger.error('Failed to update expense split', error);
      throw new InternalServerErrorException('Failed to update expense split');
    }
  }

  /**
   * Record a payment (full or partial) against an expense split.
   *
   * The payment row stores the user's claimed amount and starts unverified.
   * Settlement is determined by Payment.isVerified across all payment rows
   * for this split — not by ExpenseSplit.isPaid (deprecated).
   */
  async markAsPaid(
    id: string,
    userId: string,
    paymentMethod: PaymentMethod,
    amountPaid: number,
    paymentProof?: string,
  ) {
    this.logger.log(`Recording payment on split ${id} by user ${userId}...`);
    const split = await this.findOne(id);

    if (split.userId !== userId) {
      throw new HttpException(
        'You can only record payments on your own splits',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!isFinite(amountPaid) || amountPaid <= 0) {
      throw new HttpException(
        'Payment amount must be greater than zero',
        HttpStatus.BAD_REQUEST,
      );
    }

    const claimed = sumPayments(split.payments, false);
    const remaining = split.amount - claimed;
    if (remaining <= 0.01) {
      throw new HttpException(
        'This split is already fully paid (or has pending payments covering it)',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (amountPaid > remaining + 0.01) {
      throw new HttpException(
        `Payment exceeds remaining balance of ${remaining.toFixed(2)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const payment = await this.prisma.payment.create({
        data: {
          amountPaid,
          paymentMethod,
          paymentProof,
          isVerified: false,
          expenseSplitId: id,
        },
      });

      // Re-fetch the split with payments to return an up-to-date view.
      const updatedSplit = await this.findOne(id);

      this.logger.log(
        `Payment ${payment.id} (${amountPaid}) recorded on split ${id}; new claimed=${claimed + amountPaid}/${split.amount}`,
      );
      return { payment, split: updatedSplit };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Error recording payment on split', error);
      throw new InternalServerErrorException('Failed to record payment', {
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
