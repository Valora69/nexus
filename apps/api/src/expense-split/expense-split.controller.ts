import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ExpenseSplitService } from './expense-split.service';
import { CreateExpenseSplitDto } from './dto/create-expense-split.dto';
import { UpdateExpenseSplitDto } from './dto/update-expense-split.dto';
import { PaymentMethod } from '@prisma/client';

class MarkAsPaidDto {
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amountPaid: number;

  @IsOptional()
  @IsString()
  paymentProof?: string;
}

@Controller('expense-splits')
export class ExpenseSplitController {
  constructor(private readonly expenseSplitService: ExpenseSplitService) {}

  @Post()
  create(@Body() createExpenseSplitDto: CreateExpenseSplitDto) {
    return this.expenseSplitService.create(createExpenseSplitDto);
  }

  @Get()
  findAll() {
    return this.expenseSplitService.findAll();
  }

  @Get('my-payables')
  findMyPayables(@Req() req) {
    return this.expenseSplitService.findMyPayables(req.user.sub);
  }

  @Get('my-receivables')
  findMyReceivables(@Req() req) {
    return this.expenseSplitService.findMyReceivables(req.user.sub);
  }

  @Get('expense/:expenseId')
  findByExpenseId(@Param('expenseId') expenseId: string) {
    return this.expenseSplitService.findByExpenseId(expenseId);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.expenseSplitService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseSplitService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExpenseSplitDto: UpdateExpenseSplitDto,
  ) {
    return this.expenseSplitService.update(id, updateExpenseSplitDto);
  }

  @Post(':id/mark-paid')
  markAsPaid(
    @Param('id') id: string,
    @Body() body: MarkAsPaidDto,
    @Req() req,
  ) {
    return this.expenseSplitService.markAsPaid(
      id,
      req.user.sub,
      body.paymentMethod,
      body.amountPaid,
      body.paymentProof,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseSplitService.remove(id);
  }
}
