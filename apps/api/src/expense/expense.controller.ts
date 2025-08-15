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
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  CreateManyExpensesDto,
} from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AssignExpenseDto } from './dto/assign-expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req) {
    return this.expenseService.create(createExpenseDto, req.user.sub);
  }

  @Post('create-many')
  createMany(@Body() createManyExpensesDto: CreateManyExpensesDto, @Req() req) {
    return this.expenseService.createMany(createManyExpensesDto, req.user.sub);
  }

  @Get()
  findAll(@Req() req) {
    return this.expenseService.findAll(req.user.sub);
  }

  @Get('payables')
  findAllPayables(@Req() req) {
    return this.expenseService.findAllPayables(req.user.sub);
  }

  @Get('receivables')
  findAllReceivables(@Req() req) {
    return this.expenseService.findAllReceivables(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }

  @Patch(':id/assign-payee')
  assignPayee(
    @Param('id') id: string,
    @Body() assignExpenseDto: AssignExpenseDto,
  ) {
    return this.expenseService.assignPayee(id, assignExpenseDto.userId);
  }

  @Patch(':id/assign-payer')
  assignPayer(
    @Param('id') id: string,
    @Body() assignExpenseDto: AssignExpenseDto,
  ) {
    return this.expenseService.assignPayer(id, assignExpenseDto.userId);
  }
}
