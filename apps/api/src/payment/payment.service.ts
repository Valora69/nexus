import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    try {
      const createdPayment = await this.prisma.payment.create({
        data: createPaymentDto,
      });
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

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id);
    try {
      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: updatePaymentDto,
      });
      return updatedPayment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      const deletedPayment = await this.prisma.payment.delete({
        where: { id },
      });
      return deletedPayment;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete payment', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
