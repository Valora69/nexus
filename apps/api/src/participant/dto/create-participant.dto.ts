import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateParticipantDto {
  @IsNotEmpty()
  @IsUUID()
  expenseId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  shareAmount: number;

  @IsOptional()
  @IsBoolean()
  isSettled?: boolean;

  @IsOptional()
  @IsDateString()
  settledAt?: string;
}
