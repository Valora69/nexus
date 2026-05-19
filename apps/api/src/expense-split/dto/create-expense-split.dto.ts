import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateExpenseSplitDto {
  @IsNotEmpty()
  @IsUUID()
  expenseId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
