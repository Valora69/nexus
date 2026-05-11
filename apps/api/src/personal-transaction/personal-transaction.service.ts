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

  async findAll(userId: string, type?: PersonalTransactionType) {
    try {
      return await this.prisma.personalTransaction.findMany({
        where: {
          userId,
          ...(type && { type }),
        },
        include: {
          expenseSplit: {
            include: {
              expense: {
                include: {
                  group: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
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
    if (tx.isFromGroup) {
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
