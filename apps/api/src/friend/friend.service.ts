import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class FriendService {
  private readonly logger = new Logger(FriendService.name, { timestamp: true });

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendFriendRequest(senderId: string, recipientEmail: string) {
    this.logger.log(`Sending friend request from ${senderId} to ${recipientEmail}`);

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    if (sender.email === recipientEmail) {
      throw new BadRequestException("You can't add yourself as a friend");
    }

    // Check if already friends
    const existingFriend = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friend: { email: recipientEmail } },
          { friendId: senderId, user: { email: recipientEmail } },
        ],
      },
    });

    if (existingFriend) {
      throw new BadRequestException('Already friends with this user');
    }

    // Check if there's already a pending request
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        senderId,
        recipientEmail,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Friend request already sent');
    }

    // Check if recipient exists in system
    const recipient = await this.prisma.user.findUnique({
      where: { email: recipientEmail },
    });

    try {
      // Create friend request
      const request = await this.prisma.friendRequest.create({
        data: {
          senderId,
          recipientEmail,
          recipientId: recipient?.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send email invitation
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/friends/accept?token=${request.token}`;

      await this.emailService.sendFriendRequestEmail({
        to: recipientEmail,
        senderName: sender.name || sender.email,
        inviteUrl,
        isNewUser: !recipient,
      });

      this.logger.log(`Friend request sent successfully to ${recipientEmail}`);
      return { message: 'Friend request sent!' };
    } catch (error) {
      this.logger.error('Error sending friend request', error);
      throw new InternalServerErrorException('Failed to send friend request');
    }
  }

  async getPendingRequests(userId: string) {
    this.logger.log(`Getting pending requests for user ${userId}`);

    return this.prisma.friendRequest.findMany({
      where: {
        recipientId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, picture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSentRequests(userId: string) {
    this.logger.log(`Getting sent requests for user ${userId}`);

    return this.prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'PENDING',
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true, picture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptRequest(userId: string, requestId: string) {
    this.logger.log(`User ${userId} accepting request ${requestId}`);

    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.recipientId !== userId) {
      throw new BadRequestException('You cannot accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    if (request.expiresAt < new Date()) {
      throw new BadRequestException('This request has expired');
    }

    try {
      await this.prisma.$transaction([
        // Create friendship (both directions for easy querying)
        this.prisma.friendship.create({
          data: { userId: request.senderId, friendId: userId },
        }),
        this.prisma.friendship.create({
          data: { userId: userId, friendId: request.senderId },
        }),
        // Update request status
        this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      this.logger.log(`Friend request ${requestId} accepted successfully`);
      return { message: 'Friend request accepted!' };
    } catch (error) {
      this.logger.error('Error accepting friend request', error);
      throw new InternalServerErrorException('Failed to accept friend request');
    }
  }

  async acceptRequestByToken(userId: string, token: string) {
    this.logger.log(`Accepting request by token for user ${userId}`);

    const request = await this.prisma.friendRequest.findUnique({
      where: { token },
      include: { sender: true },
    });

    if (!request) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    // Update the recipientId if it wasn't set (user didn't exist when request was sent)
    if (!request.recipientId) {
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { recipientId: userId },
      });
      request.recipientId = userId;
    }

    if (request.recipientId !== userId) {
      throw new BadRequestException('This invite is not for you');
    }

    return this.acceptRequest(userId, request.id);
  }

  async declineRequest(userId: string, requestId: string) {
    this.logger.log(`User ${userId} declining request ${requestId}`);

    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.recipientId !== userId) {
      throw new BadRequestException('Invalid request');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED' },
    });

    return { message: 'Friend request declined' };
  }

  async getFriends(userId: string) {
    this.logger.log(`Getting friends for user ${userId}`);

    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: { id: true, name: true, email: true, picture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => f.friend);
  }

  async removeFriend(userId: string, friendId: string) {
    this.logger.log(`User ${userId} removing friend ${friendId}`);

    try {
      await this.prisma.$transaction([
        this.prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId, friendId },
              { userId: friendId, friendId: userId },
            ],
          },
        }),
      ]);

      return { message: 'Friend removed successfully' };
    } catch (error) {
      this.logger.error('Error removing friend', error);
      throw new InternalServerErrorException('Failed to remove friend');
    }
  }
}
