import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name, { timestamp: true });

  constructor(private readonly prismaService: PrismaService) {}

  // Fire-and-forget: failures must never propagate to the caller
  @OnEvent('activity.created')
  async create(createActivityDto: CreateActivityDto) {
    try {
      await this.prismaService.activity.create({
        data: {
          createdByUserId: createActivityDto.createdByUserId,
          activityName: createActivityDto.activityName,
          activityOn: createActivityDto.activityOn,
          groupId: createActivityDto.groupId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create activity (non-fatal)', error);
    }
  }

  async findAll(skip?: number, take?: number) {
    try {
      return await this.prismaService.activity.findMany({
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllByGroup(id: string, skip?: number, take?: number) {
    try {
      // Existence-only probe — was loading full Group row just to check existence.
      const group = await this.prismaService.group.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!group) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }

      return await this.prismaService.activity.findMany({
        where: { groupId: id },
        orderBy: { createdAt: 'desc' },
        skip: skip ?? 0,
        take: Math.min(take ?? 50, 100),
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
