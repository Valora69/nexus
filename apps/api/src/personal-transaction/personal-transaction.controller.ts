import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { PersonalTransactionService } from './personal-transaction.service';
import { QuickCaptureDto } from './dto/quick-capture.dto';
import { CreatePersonalTransactionDto } from './dto/create-personal-transaction.dto';
import { PersonalTransactionType } from '@prisma/client';

@Controller('personal-transactions')
export class PersonalTransactionController {
  constructor(private readonly service: PersonalTransactionService) {}

  @Post('quick-capture')
  quickCapture(@Body() dto: QuickCaptureDto, @Req() req) {
    return this.service.quickCapture(dto.input, req.user.sub);
  }

  @Post()
  create(@Body() dto: CreatePersonalTransactionDto, @Req() req) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('type') type?: PersonalTransactionType,
  ) {
    return this.service.findAll(req.user.sub, type);
  }

  @Get('summary')
  getSummary(@Req() req) {
    return this.service.getSummary(req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user.sub);
  }
}
