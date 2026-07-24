import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import type {
  CreateUserInput,
  UpdateUserInput,
} from '@/lib/server/schemas/user';

export async function createUser(dto: CreateUserInput) {
  try {
    const createdUser = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        googleId: dto.googleId,
        picture: dto.picture,
      },
    });
    return createdUser;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new ApiError(500, 'Failed to create user');
  }
}

export async function findAllUsers(currentUserId?: string) {
  try {
    if (!currentUserId) {
      return await prisma.user.findMany();
    }
    return await prisma.user.findMany({
      where: {
        groups: {
          some: {
            group: {
              members: {
                some: { userId: currentUserId },
              },
            },
          },
        },
      },
    });
  } catch {
    throw new ApiError(500, 'Failed to fetch users');
  }
}

export async function findOneUser(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch user');
  }
}

export async function findCurrentUser(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        googleId: true,
        gcashNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch current user');
  }
}

export async function updateUser(id: string, dto: UpdateUserInput) {
  await findOneUser(id);
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: dto,
    });
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw new ApiError(500, 'Failed to update user');
  }
}

export async function removeUser(id: string) {
  await findOneUser(id);
  try {
    const deletedUser = await prisma.user.delete({
      where: { id },
    });
    return deletedUser;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new ApiError(500, 'Failed to delete user');
  }
}
