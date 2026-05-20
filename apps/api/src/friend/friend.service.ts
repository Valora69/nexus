import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class FriendService {
  private readonly logger = new Logger(FriendService.name, { timestamp: true });

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async sendFriendRequest(senderId: string, recipientEmailRaw: string) {
    // Normalize casing — emails are stored lowercase server-side.
    const recipientEmail = recipientEmailRaw.toLowerCase().trim();
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

    // Check for a reverse-direction pending request (recipient already requested sender)
    if (recipient) {
      const reverseRequest = await this.prisma.friendRequest.findFirst({
        where: {
          senderId: recipient.id,
          recipientEmail: sender.email,
          status: 'PENDING',
        },
      });

      if (reverseRequest) {
        // Auto-accept: create friendship from both directions and mark the existing request accepted
        await this.prisma.$transaction([
          this.prisma.friendship.createMany({
            data: [
              { userId: senderId, friendId: recipient.id },
              { userId: recipient.id, friendId: senderId },
            ],
            skipDuplicates: true,
          }),
          this.prisma.friendRequest.update({
            where: { id: reverseRequest.id },
            data: { status: 'ACCEPTED' },
          }),
        ]);
        this.logger.log(
          `Auto-accepted: ${senderId} and ${recipient.id} are now friends`,
        );
        return { message: 'You were already requested by this user — you are now friends!' };
      }
    }

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

      // Fire-and-forget: email runs in the background so the HTTP response
      // returns immediately after the DB write, regardless of SMTP outcome.
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontendUrl}/friends/accept?token=${request.token}`;
      void this.emailService
        .sendFriendRequestEmail({
          to: recipientEmail,
          senderName: sender.name || sender.email,
          inviteUrl,
          isNewUser: !recipient,
        })
        .catch((err: unknown) =>
          this.logger.error('Background email task failed', err),
        );

      this.logger.log(`Friend request sent successfully to ${recipientEmail}`);
      return { message: 'Friend request sent!' };
    } catch (error) {
      this.logger.error('Error sending friend request', error);
      throw new InternalServerErrorException('Failed to send friend request');
    }
  }

  async getPendingRequests(userId: string, skip?: number, take?: number) {
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
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
    });
  }

  async getSentRequests(userId: string, skip?: number, take?: number) {
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
      skip: skip ?? 0,
      take: Math.min(take ?? 50, 100),
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
      throw new ForbiddenException('You cannot accept this request');
    }

    if (request.senderId === userId) {
      throw new BadRequestException("You can't accept your own request");
    }

    if (request.expiresAt < new Date()) {
      throw new BadRequestException('This request has expired');
    }

    // Idempotent: if already accepted, return success (friendship should already exist)
    if (request.status === 'ACCEPTED') {
      this.logger.log(`Request ${requestId} already accepted — returning success`);
      return { message: 'Friend request already accepted' };
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been processed');
    }

    try {
      // Use createMany + skipDuplicates so re-entry / race doesn't trip the unique constraint.
      // We create both directions for easy querying.
      // Also clean up any reverse-direction pending request between these two users.
      await this.prisma.$transaction([
        this.prisma.friendship.createMany({
          data: [
            { userId: request.senderId, friendId: userId },
            { userId: userId, friendId: request.senderId },
          ],
          skipDuplicates: true,
        }),
        this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        }),
        this.prisma.friendRequest.updateMany({
          where: {
            senderId: userId,
            recipientEmail: request.sender.email,
            status: 'PENDING',
          },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      this.logger.log(`Friend request ${requestId} accepted successfully`);
      return { message: 'Friend request accepted!' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Friendship already existed — treat as success
        this.logger.warn(
          `Friendship already existed for request ${requestId}; marking accepted`,
        );
        await this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        });
        return { message: 'Friend request accepted!' };
      }
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

    // Verify the logged-in user's email matches the recipient on the invite.
    // Prevents a different account from claiming someone else's invite.
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (
      request.recipientEmail.toLowerCase() !== currentUser.email.toLowerCase()
    ) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    // Backfill recipientId if it wasn't set (recipient didn't have an account when invite was sent)
    if (!request.recipientId) {
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { recipientId: userId },
      });
      request.recipientId = userId;
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

  async getFriends(userId: string, skip?: number, take?: number) {
    this.logger.log(`Getting friends for user ${userId}`);

    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      // Lean select — drop the Friendship row, project the friend user directly.
      select: {
        friend: {
          select: { id: true, name: true, email: true, picture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: Math.min(take ?? 100, 200),
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
