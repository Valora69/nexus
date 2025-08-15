import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignExpenseDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}