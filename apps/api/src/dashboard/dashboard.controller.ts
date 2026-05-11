import { Controller, Get, Query, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getDashboard(@Req() req, @Query('month') month?: string) {
    return this.service.getDashboard(req.user.sub, month);
  }
}
