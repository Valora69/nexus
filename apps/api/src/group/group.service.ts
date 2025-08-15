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

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(GroupService.name, {
    timestamp: true,
  });

  async create(createGroupDto: CreateGroupDto, userId: string) {
    this.logger.log('Creating group...');
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

      this.logger.log(`Group created successfully with id: ${createdGroup.id}`);
    } catch (error) {
      this.logger.error('Error creating group', error);
      throw new InternalServerErrorException('Failed to create group', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
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
