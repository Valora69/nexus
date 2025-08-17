import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto, @Req() req) {
    return this.activityService.create({
      ...createActivityDto,
      createdByUserId: req.user.sub
     });
  }

  @Get()
  findAll(@Req() req) {
    return this.activityService.findAll();
  }

  @Get(':id')
  findAllByGroup(@Param('id') id: string, @Req() req) {
    return this.activityService.findAllByGroup(id);
  }
}