import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto) {
    try {
      const existingGroup = await this.prisma.group.findUnique({
        where: { name: createGroupDto.name },
      });
      if (existingGroup) {
        throw new HttpException('Group already exists', HttpStatus.CONFLICT);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to check group existence',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }

    return this.prisma.group.create({
      data: createGroupDto,
    });
  }

  async findAll() {
    try {
      return await this.prisma.group.findMany();
    } catch (error) {
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

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    try {
      return await this.prisma.group.update({
        where: { id },
        data: updateGroupDto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.group.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }
}
