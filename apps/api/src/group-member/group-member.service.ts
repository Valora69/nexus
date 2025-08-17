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

@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(GroupMemberService.name, {
    timestamp: true,
  });
  async create(createGroupMemberDto: CreateGroupMemberDto) {
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

      const createdMember = await this.prisma.groupMember.create({
        data: createGroupMemberDto,
        include: {
          user: true,
          group: true,
        },
      });

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

  async remove(id: string) {
    this.logger.log('Removing group member...');
    await this.findOne(id);
    try {
      const deletedMember = await this.prisma.groupMember.delete({
        where: { id },
      });
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
