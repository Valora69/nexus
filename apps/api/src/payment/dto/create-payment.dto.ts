import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID()
  expenseSplitId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amountPaid: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentProof?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
