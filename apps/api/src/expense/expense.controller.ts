import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  CreateManyExpensesDto,
} from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ThrottleWrite } from 'src/common/throttle.decorators';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @ThrottleWrite()
  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto, @Req() req) {
    return this.expenseService.create(createExpenseDto, req.user.sub);
  }

  @ThrottleWrite()
  @Post('create-many')
  createMany(@Body() createManyExpensesDto: CreateManyExpensesDto, @Req() req) {
    return this.expenseService.createMany(createManyExpensesDto, req.user.sub);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('type') type?: 'payable' | 'receivable',
    @Query('groupId') groupId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.expenseService.findAll(
      req.user.sub,
      type,
      groupId,
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @ThrottleWrite()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @Req() req) {
    return this.expenseService.update(id, updateExpenseDto, req.user.sub);
  }

  @ThrottleWrite()
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.expenseService.remove(id, req.user.sub);
  }
}
