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
import { ActivityNameEnum, ActivityOnEnum, PersonalTransactionType, Prisma } from '@prisma/client';
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

  // Validates input and writes a single expense inside the provided transaction
  // client. Pulled out so createMany can run all writes in one atomic tx.
  private async createExpenseInTx(
    tx: Prisma.TransactionClient,
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ) {
    const { groupId, payeeId, payerId, splits, ...rest } = createExpenseDto;

    // Validations use top-level prisma since they're reads — fine outside tx
    await this.validateGroupExists(groupId);
    if (userId) {
      await Promise.all([
        this.validateUserExists(userId),
        this.validateGroupMembership(userId, groupId),
      ]);
    }

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
      await Promise.all(
        splits.map((split) =>
          this.validateGroupMembership(split.userId, groupId),
        ),
      );
    }

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
              })),
            },
          }),
        ...rest,
      },
      include: EXPENSE_INCLUDE,
    });

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
  }

  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    this.logger.log('Creating expense...');
    try {
      const createdExpense = await this.prisma.$transaction((tx) =>
        this.createExpenseInTx(tx, createExpenseDto, userId),
      );

      this.eventEmitter.emit('activity.created', {
        createdByUserId: userId,
        activityName: ActivityNameEnum.CREATED,
        activityOn: ActivityOnEnum.EXPENSE,
        groupId: createExpenseDto.groupId,
      });

      this.logger.log(
        `Expense created successfully with id: ${createdExpense.id}${createExpenseDto.splits ? ` and ${createExpenseDto.splits.length} splits` : ''}`,
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
      // Single transaction — all-or-nothing. A failure on any expense rolls
      // back every prior one, so users never see partial-success state.
      const createdExpenses = await this.prisma.$transaction(async (tx) => {
        const results = [];
        for (const dto of expenses) {
          results.push(await this.createExpenseInTx(tx, dto, userId));
        }
        return results;
      });

      // Emit activities outside the tx (event emission shouldn't roll DB back).
      for (const dto of expenses) {
        this.eventEmitter.emit('activity.created', {
          createdByUserId: userId,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.EXPENSE,
          groupId: dto.groupId,
        });
      }

      this.logger.log(
        `Created ${createdExpenses.length} expenses successfully`,
      );
      return createdExpenses;
    } catch (error) {
      this.logger.error('Error creating multiple expenses', error);
      if (error instanceof HttpException) throw error;
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
    this.logger.log('Updating expense...');

    const existing = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        splits: { include: { payments: true } },
      },
    });
    if (!existing) {
      throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
    }

    const { splits, payeeId, payerId, groupId, ...rest } = updateExpenseDto;

    // If splits are provided, perform a full atomic replace with safety checks.
    if (splits !== undefined) {
      return this.updateWithSplits(id, existing, updateExpenseDto, userId);
    }

    // Metadata-only update (name, totalAmount, date, notes, payer/payee/group relations).
    try {
      const updateData: any = { ...rest };
      if (payerId) updateData.payer = { connect: { id: payerId } };
      if (payeeId) updateData.payee = { connect: { id: payeeId } };
      if (groupId) updateData.group = { connect: { id: groupId } };

      const updatedExpense = await this.prisma.expense.update({
        where: { id },
        data: updateData,
        include: EXPENSE_INCLUDE,
      });

      let activityOn: ActivityOnEnum = ActivityOnEnum.EXPENSE;
      if (payeeId && !payerId) activityOn = ActivityOnEnum.EXPENSE_PAYEE;
      else if (payerId && !payeeId) activityOn = ActivityOnEnum.EXPENSE_PAYER;

      this.eventEmitter.emit('activity.created', {
        groupId: updatedExpense.groupId,
        activityName: ActivityNameEnum.UPDATED,
        activityOn,
        createdByUserId: userId,
      });

      return updatedExpense;
    } catch (error) {
      this.logger.error('Failed to update expense');
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  private async updateWithSplits(
    id: string,
    existing: { id: string; totalAmount: number; groupId: string; splits: Array<{ id: string; payments: Array<{ isVerified: boolean }> }> },
    dto: UpdateExpenseDto,
    userId: string,
  ) {
    const { splits, payeeId, payerId, groupId, ...rest } = dto;

    // Settlement-safety: any verified payment locks the expense from split edits.
    const hasVerifiedPayments = existing.splits.some((s) =>
      s.payments.some((p) => p.isVerified),
    );
    if (hasVerifiedPayments) {
      throw new HttpException(
        'Cannot edit splits: this expense has verified payments. Delete and recreate it instead.',
        HttpStatus.CONFLICT,
      );
    }

    if (!splits || splits.length === 0) {
      throw new HttpException(
        'Splits array must be non-empty when editing splits',
        HttpStatus.BAD_REQUEST,
      );
    }

    const effectiveTotal = rest.totalAmount ?? existing.totalAmount;
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - effectiveTotal) > 0.01) {
      throw new HttpException(
        'Split amounts must equal total expense amount',
        HttpStatus.BAD_REQUEST,
      );
    }

    const effectiveGroupId = groupId ?? existing.groupId;
    await Promise.all(
      splits.map((s) => this.validateGroupMembership(s.userId, effectiveGroupId)),
    );

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const oldSplitIds = existing.splits.map((s) => s.id);

        // Schema cascades ExpenseSplit -> Payment (Payment.expenseSplitId
        // has onDelete: Cascade), so deleting splits also wipes their
        // pending payments. PersonalTransaction.expenseSplitId is SetNull
        // in the schema, so we delete those rows explicitly to avoid
        // orphaned ledger entries.
        if (oldSplitIds.length > 0) {
          await tx.personalTransaction.deleteMany({
            where: { expenseSplitId: { in: oldSplitIds } },
          });
          await tx.expenseSplit.deleteMany({
            where: { expenseId: id },
          });
        }

        const updateData: any = { ...rest };
        if (payerId) updateData.payer = { connect: { id: payerId } };
        if (payeeId) updateData.payee = { connect: { id: payeeId } };
        if (groupId) updateData.group = { connect: { id: groupId } };
        updateData.splits = {
          create: splits.map((s) => ({
            user: { connect: { id: s.userId } },
            amount: s.amount,
          })),
        };

        const expense = await tx.expense.update({
          where: { id },
          data: updateData,
          include: EXPENSE_INCLUDE,
        });

        if (expense.splits && expense.splits.length > 0) {
          await tx.personalTransaction.createMany({
            data: expense.splits.map((s) => ({
              userId: s.userId,
              type: PersonalTransactionType.EXPENSE,
              amount: s.amount,
              description: expense.name,
              category: expense.group.name,
              isFromGroup: true,
              expenseSplitId: s.id,
              date: expense.date,
            })),
          });
        }

        return expense;
      });

      this.eventEmitter.emit('activity.created', {
        groupId: updated.groupId,
        activityName: ActivityNameEnum.UPDATED,
        activityOn: ActivityOnEnum.EXPENSE,
        createdByUserId: userId,
      });

      this.logger.log(
        `Expense ${id} updated with ${splits.length} replacement splits`,
      );
      return updated;
    } catch (error) {
      this.logger.error('Failed to update expense with splits', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log('Removing expense...');

    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: { id: true, groupId: true, payerId: true, payeeId: true },
    });
    if (!expense) {
      throw new HttpException('Expense not found', HttpStatus.NOT_FOUND);
    }

    // Authorization: payer, payee, or any group member may delete.
    // Anything stricter (e.g. payer-only) blocks legitimate cleanup when the
    // original payer leaves the group.
    const isPrincipal =
      expense.payerId === userId || expense.payeeId === userId;
    if (!isPrincipal) {
      const member = await this.prisma.groupMember.findUnique({
        where: { GroupMemberUnique: { userId, groupId: expense.groupId } },
        select: { id: true },
      });
      if (!member) {
        throw new HttpException(
          'You do not have permission to delete this expense',
          HttpStatus.FORBIDDEN,
        );
      }
    }

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
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to delete expense', error);
      throw new InternalServerErrorException('Failed to delete expense', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
