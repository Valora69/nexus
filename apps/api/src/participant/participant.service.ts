import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ParticipantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createParticipantDto: CreateParticipantDto) {
    try {
      const createdParticipant = await this.prisma.participant.create({
        data: createParticipantDto,
      });
      return createdParticipant;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create participant', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll() {
    try {
      return await this.prisma.participant.findMany();
    } catch {
      throw new InternalServerErrorException('Failed to fetch participants');
    }
  }

  async findByExpenseId(expenseId: string) {
    try {
      return await this.prisma.participant.findMany({
        where: { expenseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch participants by expense ID',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findByUserId(userId: string) {
    try {
      return await this.prisma.participant.findMany({
        where: {
          userId,
          isSettled: false,
        },
        include: {
          expense: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              date: true,
              paidById: true,
              paidBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch participants by user ID',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findAllWhoOweMe(currentUserId: string) {
    try {
      return await this.prisma.participant.findMany({
        where: {
          isSettled: false,
          expense: {
            paidById: currentUserId,
          },
          userId: {
            not: currentUserId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          expense: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              date: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to fetch people who owe you money',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  async findOne(id: string) {
    try {
      const participant = await this.prisma.participant.findUnique({
        where: { id },
      });
      if (!participant) {
        throw new HttpException('Participant not found', HttpStatus.NOT_FOUND);
      }
      return participant;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch participant');
    }
  }

  async update(id: string, updateParticipantDto: UpdateParticipantDto) {
    await this.findOne(id);
    try {
      const updatedParticipant = await this.prisma.participant.update({
        where: { id },
        data: updateParticipantDto,
      });
      return updatedParticipant;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update participant', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      const deletedParticipant = await this.prisma.participant.delete({
        where: { id },
      });
      return deletedParticipant;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete participant', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
