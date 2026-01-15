import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';


@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService, private eventEmitter: EventEmitter2) {}
  private readonly logger = new Logger(GroupService.name, {
    timestamp: true,
  });

  async create(createGroupDto: CreateGroupDto, userId: string) {
    this.logger.log('Creating group...');
    const currentUserId = userId;
    
    try {
      const createdGroup = await this.prisma.$transaction(async (prisma) => {
        const group = await prisma.group.create({
          data: {
            createdBy: {
              connect: {
                id: userId,
              },
            },
            ...createGroupDto,
          },
        });

        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: userId,
          },
        });

        

        return group;
      });

      if(createdGroup){
        const groupData = {
          groupId: createdGroup.id,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.GROUP_DETAILS,
          userId: currentUserId,
       };
        this.eventEmitter.emit('activity.created', groupData);
      }

      this.logger.log(`Group created successfully with id: ${createdGroup.id}`);
    } catch (error) {
      this.logger.error('Error creating group', error);
      throw new InternalServerErrorException('Failed to create group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll(userId: string) {
    this.logger.log('Retrieving groups for user...');
    try {
      const groups = await this.prisma.group.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Found ${groups.length} groups for user ${userId}`);
      return groups;
    } catch (error) {
      this.logger.error('Error fetching groups for user');
      throw new InternalServerErrorException('Failed to fetch groups', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.group.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          expenses: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              date: true,
            },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async update(id: string, updateGroupDto: UpdateGroupDto,userId: string ) {
    const currentUserId = userId;
    try {
      const updatedGroup = await this.prisma.group.update({
        where: { id },
        data: updateGroupDto,
      });

      if (updatedGroup) {
        this.eventEmitter.emit('activity.created', {
          groupId: updatedGroup.id,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.GROUP_DETAILS,
          userId: currentUserId,
        });

      return updatedGroup;
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to update group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string, userId: string) {
    const currentUserId = userId;
    try {
       const deletedGroup = await this.prisma.group.delete({
        where: { id },
      });

      if (deletedGroup) {
        this.eventEmitter.emit('activity.created', {
          groupId: deletedGroup.id,
          activityName: ActivityNameEnum.DELETED,
          activityOn: ActivityOnEnum.GROUP_DETAILS,
          userId: currentUserId,
        });
      }

      return deletedGroup;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
