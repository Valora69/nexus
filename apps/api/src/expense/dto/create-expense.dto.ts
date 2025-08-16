import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsNotEmpty()
  @IsUUID()
  payeeId?: string;

  @IsNotEmpty()
  @IsUUID()
  payerId?: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateManyExpensesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses: CreateExpenseDto[];
}
