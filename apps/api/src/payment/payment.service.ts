import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';


@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string) {
    
    try {
      const createdPayment = await this.prisma.payment.create({
        data: createPaymentDto,
        include: {
          expense: true
        }
      });

      if(createdPayment && createdPayment.expense){
        this.eventEmitter.emit('activity.created', {
          groupId: createdPayment.expense.groupId,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.PAYMENT,
          createdByUserId: userId,
        });
      }
      return createdPayment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll() {
    try {
      return await this.prisma.payment.findMany();
    } catch {
      throw new InternalServerErrorException('Failed to fetch payments');
    }
  }

  async findOne(id: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
      });
      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }
      return payment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch payment');
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId: string) {
    await this.findOne(id);
    try {
      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: updatePaymentDto,
        include: {
          expense: true
        }
      });

      if(updatedPayment && updatedPayment.expense){
        this.eventEmitter.emit('activity.created', {
          groupId: updatedPayment.expense.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.PAYMENT,
          createdByUserId: userId,
        });
      }
      return updatedPayment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);
    try {
      const deletedPayment = await this.prisma.payment.delete({
        where: { id },
        include: {
          expense: true
        }
      });
      if(deletedPayment && deletedPayment.expense){
        this.eventEmitter.emit('activity.created', {
          groupId: deletedPayment.expense.groupId,
          activityName: ActivityNameEnum.DELETED,
          activityOn: ActivityOnEnum.PAYMENT,
          createdByUserId: userId,
        });
      }
      return deletedPayment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
