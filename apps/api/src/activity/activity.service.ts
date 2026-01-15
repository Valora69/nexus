import { HttpException, HttpStatus,  Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prismaService: PrismaService,
    
  ) {}
  @OnEvent('activity.created')
  async create(createActivityDto: CreateActivityDto) {
    
    try {
      const newActivity = await this.prismaService.activity.create({
        data: {
          createdByUserId: createActivityDto.createdByUserId,
          activityName: createActivityDto.activityName,
          activityOn: createActivityDto.activityOn,
          groupId: createActivityDto.groupId,
        },
      });

      if (!newActivity) {
        throw new HttpException('Activity not created', HttpStatus.BAD_REQUEST);
      }

      return {
        status: HttpStatus.CREATED,
        message: 'Activity created successfully',
        data: newActivity,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll() {
    try {
      const activities = await this.prismaService.activity.findMany();

      return activities;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async findAllByGroup(id: string) {
    try {
      const group = await this.prismaService.group.findUnique({
        where: { id },
      });

      if (!group) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }

      return await this.prismaService.activity.findMany({
        where: { groupId: id },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
