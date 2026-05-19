import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseSplitDto } from './create-expense-split.dto';

// isPaid / paidAt removed — settlement is tracked via Payment.isVerified.
export class UpdateExpenseSplitDto extends PartialType(CreateExpenseSplitDto) {}
