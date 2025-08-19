import {
  Injectable,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';


@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}
  private readonly logger = new Logger(GroupMemberService.name, {
    timestamp: true,
  });
  async create(createGroupMemberDto: CreateGroupMemberDto, userId: string) {
    this.logger.log('Creating group member...');
    try {
      const existingMember = await this.prisma.groupMember.findUnique({
        where: {
          GroupMemberUnique: {
            userId: createGroupMemberDto.userId,
            groupId: createGroupMemberDto.groupId,
          },
        },
      });

      if (existingMember) {
        this.logger.error('User is already a member of this group');
        throw new HttpException(
          'User is already a member of this group',
          HttpStatus.CONFLICT,
        );
      }

      const currentUserId = userId

      const createdMember = await this.prisma.groupMember.create({
        data: createGroupMemberDto,
        include: {
          user: true,
          group: true,
        },
      });

      if(createdMember ){
         this.eventEmitter.emit('activity.created', {
          groupId: createdMember.groupId,
          activityName: ActivityNameEnum.CREATED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: currentUserId,
        });
      }

      this.logger.log('Group member created successfully');
      return createdMember;
    } catch (error) {
      this.logger.error('Error creating group member');
      throw new InternalServerErrorException('Failed to create group member', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async findAll() {
    this.logger.log('Retrieving all group members...');
    try {
      const allMembers = await this.prisma.groupMember.findMany({
        include: {
          user: true,
          group: true,
        },
      });
      return allMembers;
    } catch (error) {
      this.logger.error('Error fetching group members');
      throw new InternalServerErrorException('Failed to fetch group members');
    }
  }

  async findOne(id: string) {
    this.logger.log('Retrieving group member...');
    try {
      const member = await this.prisma.groupMember.findUnique({
        where: { id },
        include: {
          user: true,
          group: true,
        },
      });

      if (!member) {
        throw new HttpException('Group member not found', HttpStatus.NOT_FOUND);
      }

      return member;
    } catch (error) {
      this.logger.error('Failed to retrieve group member');
      throw new InternalServerErrorException('Failed to retrieve group member');
    }
  }

  async update(id: string, updateGroupMemberDto: UpdateGroupMemberDto, userId: string) {
  this.logger.log('Updating group member...');

  try {
    const existingMember = await this.findOne(id);

    if (updateGroupMemberDto.userId || updateGroupMemberDto.groupId) {
      const newUserId = updateGroupMemberDto.userId || existingMember.userId;
      const newGroupId = updateGroupMemberDto.groupId || existingMember.groupId;

      const duplicateMember = await this.prisma.groupMember.findUnique({
        where: {
          GroupMemberUnique: {
            userId: newUserId,
            groupId: newGroupId,
          },
        },
      });

      if (duplicateMember && duplicateMember.id !== id) {
        this.logger.error('User is already a member of this group');
        throw new HttpException(
          'User is already a member of this group',
          HttpStatus.CONFLICT,
        );
      }
    }

    const currentUserId = userId
    const updatedMember = await this.prisma.groupMember.update({
      where: { id },
      data: updateGroupMemberDto,
      include: {
        user: true,
        group: true,
      },
    });

    if(updatedMember ){
         this.eventEmitter.emit('activity.created', {
          groupId: updatedMember.groupId,
          activityName: ActivityNameEnum.UPDATED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: currentUserId,
        });
      }


    this.logger.log(`Group member ${id} updated successfully`);
    return updatedMember;
  } catch (error) {
    this.logger.error('Failed to update group member');
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to update group member', {
      cause: error,
      description: 'An unexpected error occurred',
    });
  }
}

  async remove(id: string, userId: string) {
    this.logger.log('Removing group member...');
    await this.findOne(id);
    try {
      const deletedMember = await this.prisma.groupMember.delete({
        where: { id },
      });

      const currentUserId = userId

      if(deletedMember){
         this.eventEmitter.emit('activity.created', {
          groupId: deletedMember.groupId,
          activityName: ActivityNameEnum.DELETED,
          activityOn: ActivityOnEnum.GROUP_MEMBER,
          createdByUserId: currentUserId,
        });
      }
      return deletedMember;
    } catch (error) {
      this.logger.error('Failed to delete group member');
      throw new InternalServerErrorException('Failed to delete group member', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
