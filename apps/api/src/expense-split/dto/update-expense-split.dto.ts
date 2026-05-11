import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseSplitDto } from './create-expense-split.dto';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateExpenseSplitDto extends PartialType(CreateExpenseSplitDto) {
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
