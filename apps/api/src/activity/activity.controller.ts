import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ActivitiesService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  findAll() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  findAllByGroup(@Param('id') id: string) {
    return this.activitiesService.findAllByGroup(id);
  }
}