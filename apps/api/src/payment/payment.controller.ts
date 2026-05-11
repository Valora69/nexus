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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ThrottleWrite } from 'src/common/throttle.decorators';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ThrottleWrite()
  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req) {
    return this.paymentService.create(createPaymentDto, req.user.sub);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.paymentService.findAll(
      req.user.sub,
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined,
    );
  }

  @Get('pending-verification')
  findPendingVerification(@Req() req) {
    return this.paymentService.findPendingVerification(req.user.sub);
  }

  @Get('pending-confirmation')
  findPendingConfirmation(@Req() req) {
    return this.paymentService.findPendingConfirmation(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @ThrottleWrite()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Req() req,
  ) {
    return this.paymentService.update(id, updatePaymentDto, req.user.sub);
  }

  @ThrottleWrite()
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.paymentService.remove(id, req.user.sub);
  }
}
