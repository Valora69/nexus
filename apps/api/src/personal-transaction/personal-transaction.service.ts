import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonalTransactionType } from '@prisma/client';
import { CreatePersonalTransactionDto } from './dto/create-personal-transaction.dto';
import { parseQuickCapture } from './quick-capture.parser';

@Injectable()
export class PersonalTransactionService {
  private readonly logger = new Logger(PersonalTransactionService.name, {
    timestamp: true,
  });

  constructor(private readonly prisma: PrismaService) {}

  async quickCapture(input: string, userId: string) {
    this.logger.log(`Quick capture: "${input}" for user ${userId}`);
    let parsed;
    try {
      parsed = parseQuickCapture(input);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid input';
      throw new BadRequestException(msg);
    }

    return this.prisma.personalTransaction.create({
      data: {
        userId,
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        source: parsed.source,
      },
    });
  }

  async create(dto: CreatePersonalTransactionDto, userId: string) {
    return this.prisma.personalTransaction.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(
    userId: string,
    type?: PersonalTransactionType,
    skip?: number,
    take?: number,
  ) {
    try {
      return await this.prisma.personalTransaction.findMany({
        where: {
          userId,
          ...(type && { type }),
        },
        // Lean select instead of nested include — only what the UI renders.
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          description: true,
          category: true,
          source: true,
          isFromGroup: true,
          expenseSplitId: true,
          date: true,
          createdAt: true,
          updatedAt: true,
          expenseSplit: {
            select: {
              expense: {
                select: {
                  group: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      this.logger.error('Failed to fetch personal transactions', error);
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  async remove(id: string, userId: string) {
    const tx = await this.prisma.personalTransaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== userId) {
      throw new BadRequestException('Transaction not found');
    }
    // Block deletion only while the transaction is still tied to a live split.
    // Once the parent expense is gone (expenseSplitId becomes null via SetNull),
    // the row is an orphan ledger entry — let the user clean it up.
    if (tx.isFromGroup && tx.expenseSplitId) {
      throw new BadRequestException(
        'Group-linked transactions cannot be deleted directly. Delete the group expense instead.',
      );
    }
    return this.prisma.personalTransaction.delete({ where: { id } });
  }

  async getSummary(userId: string) {
    const [expenses, credits, groupExpenses] = await Promise.all([
      this.prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.CREDIT },
        _sum: { amount: true },
      }),
      this.prisma.personalTransaction.aggregate({
        where: { userId, type: PersonalTransactionType.EXPENSE, isFromGroup: true },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = expenses._sum.amount ?? 0;
    const totalCredits = credits._sum.amount ?? 0;
    const groupExpensesTotal = groupExpenses._sum.amount ?? 0;

    return {
      totalExpenses,
      totalCredits,
      netBalance: totalCredits - totalExpenses,
      breakdown: {
        personalExpenses: totalExpenses - groupExpensesTotal,
        groupExpenses: groupExpensesTotal,
      },
    };
  }
}
