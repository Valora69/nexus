import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  picture: true,
  gcashNumber: true,
} as const;

// READ include — used by list/detail endpoints that render full payment UI.
const PAYMENT_INCLUDE = {
  expenseSplit: {
    include: {
      user: { select: USER_SELECT },
      expense: {
        include: {
          payer: { select: USER_SELECT },
          payee: { select: USER_SELECT },
          group: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

// Minimal selects for authorization probes in update/remove. Avoids
// hydrating the full nested tree just to check ownership.
const PAYMENT_AUTH_SELECT = {
  id: true,
  expenseSplit: {
    select: {
      userId: true,
      expense: {
        select: { groupId: true, payeeId: true },
      },
    },
  },
} as const;

// WRITE select — mutation responses the frontend types as `unknown`.
const PAYMENT_WRITE_SELECT = {
  id: true,
  amountPaid: true,
  paymentMethod: true,
  isVerified: true,
  verifiedAt: true,
  paidAt: true,
  expenseSplitId: true,
} as const;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name, {
    timestamp: true,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string) {
    this.logger.log('Creating payment...');
    try {
      // Verify the split exists and belongs to the user
      const split = await this.prisma.expenseSplit.findUnique({
        where: { id: createPaymentDto.expenseSplitId },
        include: {
          expense: true,
          user: true,
          payments: { select: { amountPaid: true } },
        },
      });

      if (!split) {
        throw new HttpException(
          'Expense split not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (split.userId !== userId) {
        throw new HttpException(
          'You can only create payments for your own splits',
          HttpStatus.FORBIDDEN,
        );
      }

      const claimed = split.payments.reduce((s, p) => s + p.amountPaid, 0);
      const remaining = split.amount - claimed;
      if (createPaymentDto.amountPaid > remaining + 0.01) {
        throw new HttpException(
          `Payment exceeds remaining balance of ${remaining.toFixed(2)}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const createdPayment = await this.prisma.payment.create({
        data: createPaymentDto,
        select: PAYMENT_WRITE_SELECT,
      });

      // Use the pre-loaded split for the activity event so we don't refetch.
      this.eventEmitter.emit('activity.created', {
        groupId: split.expense.groupId,
        activityName: ActivityNameEnum.CREATED,
        activityOn: ActivityOnEnum.PAYMENT,
        createdByUserId: userId,
      });

      this.logger.log(
        `Payment created successfully with id: ${createdPayment.id}`,
      );
      return createdPayment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to create payment', error);
      throw new InternalServerErrorException('Failed to create payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll(userId?: string, skip?: number, take?: number) {
    this.logger.log('Retrieving payments...');
    try {
      return await this.prisma.payment.findMany({
        ...(userId && {
          where: {
            OR: [
              { expenseSplit: { userId } },
              { expenseSplit: { expense: { payerId: userId } } },
            ],
          },
        }),
        include: PAYMENT_INCLUDE,
        orderBy: { paidAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      this.logger.error('Failed to fetch payments', error);
      throw new InternalServerErrorException('Failed to fetch payments', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  // Get payments pending verification (where current user is the expense payer - they receive payments)
  async findPendingVerification(userId: string, skip?: number, take?: number) {
    this.logger.log(
      `Retrieving pending verification payments for user ${userId}...`,
    );
    try {
      return await this.prisma.payment.findMany({
        where: {
          isVerified: false,
          expenseSplit: {
            expense: {
              payeeId: userId, // Current user paid the original expense
            },
            userId: { not: userId }, // But payment is from someone else
          },
        },
        include: PAYMENT_INCLUDE,
        orderBy: { paidAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      this.logger.error('Failed to fetch pending verification payments', error);
      throw new InternalServerErrorException(
        'Failed to fetch pending payments',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  // Get payments pending confirmation (where current user made the payment)
  async findPendingConfirmation(userId: string, skip?: number, take?: number) {
    this.logger.log(
      `Retrieving pending confirmation payments for user ${userId}...`,
    );
    try {
      return await this.prisma.payment.findMany({
        where: {
          isVerified: false,
          expenseSplit: {
            userId: userId, // Current user made the payment
          },
        },
        include: PAYMENT_INCLUDE,
        orderBy: { paidAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      this.logger.error('Failed to fetch pending confirmation payments', error);
      throw new InternalServerErrorException(
        'Failed to fetch pending confirmations',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findOne(id: string) {
    this.logger.log(`Retrieving payment ${id}...`);
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: PAYMENT_INCLUDE,
      });

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      return payment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to fetch payment', error);
      throw new InternalServerErrorException('Failed to fetch payment');
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId: string) {
    // Lean auth probe — no full include.
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: PAYMENT_AUTH_SELECT,
    });
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    const canUpdate =
      payment.expenseSplit.userId === userId ||
      payment.expenseSplit.expense.payeeId === userId;
    if (!canUpdate) {
      throw new HttpException(
        'You do not have permission to update this payment',
        HttpStatus.FORBIDDEN,
      );
    }

    this.logger.log(`Updating payment ${id}...`);
    try {
      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: {
          ...updatePaymentDto,
          ...(updatePaymentDto.isVerified && { verifiedAt: new Date() }),
        },
        select: PAYMENT_WRITE_SELECT,
      });

      this.eventEmitter.emit('activity.created', {
        groupId: payment.expenseSplit.expense.groupId,
        activityName: ActivityNameEnum.UPDATED,
        activityOn: ActivityOnEnum.PAYMENT,
        createdByUserId: userId,
      });

      this.logger.log(`Payment ${id} updated successfully`);
      return updatedPayment;
    } catch (error) {
      this.logger.error('Failed to update payment', error);
      throw new InternalServerErrorException('Failed to update payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    // Lean auth probe — no full include.
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: PAYMENT_AUTH_SELECT,
    });
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
    if (payment.expenseSplit.userId !== userId) {
      throw new HttpException(
        'You can only delete your own payments',
        HttpStatus.FORBIDDEN,
      );
    }

    const groupId = payment.expenseSplit.expense.groupId;

    this.logger.log(`Removing payment ${id}...`);
    try {
      const deletedPayment = await this.prisma.payment.delete({
        where: { id },
        select: { id: true },
      });

      this.eventEmitter.emit('activity.created', {
        groupId,
        activityName: ActivityNameEnum.DELETED,
        activityOn: ActivityOnEnum.PAYMENT,
        createdByUserId: userId,
      });

      this.logger.log(`Payment ${id} deleted successfully`);
      return deletedPayment;
    } catch (error) {
      this.logger.error('Failed to delete payment', error);
      throw new InternalServerErrorException('Failed to delete payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
