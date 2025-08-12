import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID()
  participantId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amountPaid: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
