import { Prisma } from '@prisma/client';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { sendFriendRequestEmail } from '@/lib/server/email';

export async function sendFriendRequest(
  senderId: string,
  recipientEmailRaw: string,
) {
  // Normalize casing — emails are stored lowercase server-side.
  const recipientEmail = recipientEmailRaw.toLowerCase().trim();

  const sender = await prisma.user.findUnique({ where: { id: senderId } });

  if (!sender) {
    throw new ApiError(404, 'Sender not found');
  }

  if (sender.email === recipientEmail) {
    throw new ApiError(400, "You can't add yourself as a friend");
  }

  // Check if already friends
  const existingFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: senderId, friend: { email: recipientEmail } },
        { friendId: senderId, user: { email: recipientEmail } },
      ],
    },
  });

  if (existingFriend) {
    throw new ApiError(400, 'Already friends with this user');
  }

  // Check if there's already a pending request
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      senderId,
      recipientEmail,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new ApiError(400, 'Friend request already sent');
  }

  // Check if recipient exists in system
  const recipient = await prisma.user.findUnique({
    where: { email: recipientEmail },
  });

  // Check for a reverse-direction pending request (recipient already requested sender)
  if (recipient) {
    const reverseRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: recipient.id,
        recipientEmail: sender.email,
        status: 'PENDING',
      },
    });

    if (reverseRequest) {
      // Auto-accept: create friendship from both directions and mark the existing request accepted
      await prisma.$transaction([
        prisma.friendship.createMany({
          data: [
            { userId: senderId, friendId: recipient.id },
            { userId: recipient.id, friendId: senderId },
          ],
          skipDuplicates: true,
        }),
        prisma.friendRequest.update({
          where: { id: reverseRequest.id },
          data: { status: 'ACCEPTED' },
        }),
      ]);
      return {
        message:
          'You were already requested by this user — you are now friends!',
      };
    }
  }

  try {
    // Create friend request
    const request = await prisma.friendRequest.create({
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
    waitUntil(
      sendFriendRequestEmail({
        to: recipientEmail,
        senderName: sender.name || sender.email,
        inviteUrl,
        isNewUser: !recipient,
      }).catch((err) =>
        console.error('Failed to send friend request email:', err),
      ),
    );

    return { message: 'Friend request sent!' };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw new ApiError(500, 'Failed to send friend request');
  }
}

export async function getPendingRequests(
  userId: string,
  skip?: number,
  take?: number,
) {
  return prisma.friendRequest.findMany({
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

export async function getSentRequests(
  userId: string,
  skip?: number,
  take?: number,
) {
  return prisma.friendRequest.findMany({
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

export async function acceptRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: { sender: true },
  });

  if (!request) {
    throw new ApiError(404, 'Friend request not found');
  }

  if (request.recipientId !== userId) {
    throw new ApiError(403, 'You cannot accept this request');
  }

  if (request.senderId === userId) {
    throw new ApiError(400, "You can't accept your own request");
  }

  if (request.expiresAt < new Date()) {
    throw new ApiError(400, 'This request has expired');
  }

  // Idempotent: if already accepted, return success (friendship should already exist)
  if (request.status === 'ACCEPTED') {
    return { message: 'Friend request already accepted' };
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(400, 'This request has already been processed');
  }

  try {
    // Use createMany + skipDuplicates so re-entry / race doesn't trip the unique constraint.
    // We create both directions for easy querying.
    // Also clean up any reverse-direction pending request between these two users.
    await prisma.$transaction([
      prisma.friendship.createMany({
        data: [
          { userId: request.senderId, friendId: userId },
          { userId: userId, friendId: request.senderId },
        ],
        skipDuplicates: true,
      }),
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.friendRequest.updateMany({
        where: {
          senderId: userId,
          recipientEmail: request.sender.email,
          status: 'PENDING',
        },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { message: 'Friend request accepted!' };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      // Friendship already existed — treat as success
      console.warn(
        `Friendship already existed for request ${requestId}; marking accepted`,
      );
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });
      return { message: 'Friend request accepted!' };
    }
    console.error('Error accepting friend request:', error);
    throw new ApiError(500, 'Failed to accept friend request');
  }
}

export async function acceptRequestByToken(userId: string, token: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { token },
    include: { sender: true },
  });

  if (!request) {
    throw new ApiError(404, 'Invalid or expired invite link');
  }

  // Verify the logged-in user's email matches the recipient on the invite.
  // Prevents a different account from claiming someone else's invite.
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  if (
    request.recipientEmail.toLowerCase() !== currentUser.email.toLowerCase()
  ) {
    throw new ApiError(
      403,
      'This invite was sent to a different email address',
    );
  }

  // Backfill recipientId if it wasn't set (recipient didn't have an account when invite was sent)
  if (!request.recipientId) {
    await prisma.friendRequest.update({
      where: { id: request.id },
      data: { recipientId: userId },
    });
    request.recipientId = userId;
  }

  return acceptRequest(userId, request.id);
}

export async function declineRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.recipientId !== userId) {
    throw new ApiError(400, 'Invalid request');
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'DECLINED' },
  });

  return { message: 'Friend request declined' };
}

export async function getFriends(userId: string, skip?: number, take?: number) {
  const friendships = await prisma.friendship.findMany({
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

export async function removeFriend(userId: string, friendId: string) {
  try {
    await prisma.$transaction([
      prisma.friendship.deleteMany({
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
    console.error('Error removing friend:', error);
    throw new ApiError(500, 'Failed to remove friend');
  }
}
