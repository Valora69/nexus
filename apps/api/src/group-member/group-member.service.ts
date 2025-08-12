import { Injectable } from '@nestjs/common';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupMemberService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createGroupMemberDto: CreateGroupMemberDto) {
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
        throw new Error('User is already a member of this group');
      }
    } catch (error) {
      throw new Error('Error creating group member');
    }
    return this.prisma.groupMember.create({
      data: createGroupMemberDto,
    });
  }

  async findAll() {
    try {
      const allMembers = await this.prisma.groupMember.findMany();
      return allMembers;
    } catch (error) {
      throw new Error('Error fetching group members');
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.groupMember.findUnique({ where: { id } });
    } catch (error) {
      throw new Error('Error fetching group member');
    }
  }

  async findByUserId(userId: string) {
    try {
      return await this.prisma.groupMember.findMany({ where: { userId } });
    } catch (error) {
      throw new Error('Error fetching group members by user ID');
    }
  }

  async update(id: string, updateGroupMemberDto: UpdateGroupMemberDto) {
    try {
      return await this.prisma.groupMember.update({
        where: { id },
        data: updateGroupMemberDto,
      });
    } catch (error) {
      throw new Error('Error updating group member');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.groupMember.delete({ where: { id } });
    } catch (error) {
      throw new Error('Error removing group member');
    }
  }
}
