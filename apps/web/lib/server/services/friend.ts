import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';
import { sendFriendRequestEmail } from '@/lib/server/email';
import {
  notifyFriendAccepted,
  notifyFriendRequest,
  resolveFriendRequest,
} from '@/lib/server/notification-events';

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

  // (senderId, recipientEmail) is unique, so there is at most one row. A live
  // pending one blocks re-sending; a declined, expired, or accepted-then-
  // unfriended one is reused below instead of tripping the unique index.
  const existingRequest = await prisma.friendRequest.findUnique({
    where: { senderId_recipientEmail: { senderId, recipientEmail } },
    select: { id: true, status: true, expiresAt: true },
  });

  if (
    existingRequest?.status === 'PENDING' &&
    existingRequest.expiresAt > new Date()
  ) {
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
      // Mutual request: sending one back accepts theirs, through the same
      // path as the accept button and the email link.
      await finalizeAcceptance({
        requestId: reverseRequest.id,
        accepterId: senderId,
        requesterId: recipient.id,
        requesterEmail: recipient.email,
      });
      return {
        message:
          'You were already requested by this user — you are now friends!',
      };
    }
  }

  try {
    const fresh = {
      recipientId: recipient?.id ?? null,
      status: 'PENDING' as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    let request: { id: string; token: string };
    if (existingRequest) {
      // Reuse the row with a new token (links from the earlier invite stop
      // working). Conditional, so two concurrent re-sends can't both win and
      // leave the first email pointing at an overwritten token.
      const token = randomUUID();
      const { count } = await prisma.friendRequest.updateMany({
        where: {
          id: existingRequest.id,
          OR: [
            { status: { not: 'PENDING' } },
            { expiresAt: { lte: new Date() } },
          ],
        },
        data: { ...fresh, token, createdAt: new Date() },
      });
      if (count === 0) {
        throw new ApiError(400, 'Friend request already sent');
      }
      request = { id: existingRequest.id, token };
    } else {
      request = await prisma.friendRequest.create({
        data: { senderId, recipientEmail, ...fresh },
        select: { id: true, token: true },
      });
    }

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
    // Invitees without an account only get the email for now.
    if (recipient) {
      await notifyFriendRequest(request.id, senderId, recipient.id);
    }

    return { message: 'Friend request sent!' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // A concurrent send of the same request won the unique index.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError(400, 'Friend request already sent');
    }
    console.error('Error sending friend request:', error);
    throw new ApiError(500, 'Failed to send friend request');
  }
}

/**
 * The single place a friend request becomes a friendship — used by the
 * accept button, the emailed invite link, and mutual-request auto-accept.
 *
 * Atomic and idempotent: the PENDING → ACCEPTED flip is a conditional
 * update, so concurrent accepts (email link + profile button, double
 * clicks, retried requests) can't both win; friendship rows are unique per
 * pair and inserted with skipDuplicates. Returns false when another call
 * already accepted it (the friendship exists either way).
 */
async function finalizeAcceptance({
  requestId,
  accepterId,
  requesterId,
  requesterEmail,
}: {
  requestId: string;
  accepterId: string;
  requesterId: string;
  requesterEmail: string;
}): Promise<boolean> {
  const accepted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.friendRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    if (count === 0) return false;

    await tx.friendship.createMany({
      data: [
        { userId: requesterId, friendId: accepterId },
        { userId: accepterId, friendId: requesterId },
      ],
      skipDuplicates: true,
    });
    // A pending request the other way is settled by the same friendship.
    await tx.friendRequest.updateMany({
      where: {
        senderId: accepterId,
        recipientEmail: requesterEmail,
        status: 'PENDING',
      },
      data: { status: 'ACCEPTED' },
    });
    return true;
  });

  if (accepted) {
    await notifyFriendAccepted(requestId, accepterId, requesterId);
  }
  return accepted;
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

  // Idempotent first, so reopening an old email link after the invite has
  // expired still reports "accepted" rather than "expired".
  if (request.status === 'ACCEPTED') {
    return { message: 'Friend request already accepted' };
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(400, 'This request has already been processed');
  }

  if (request.expiresAt < new Date()) {
    throw new ApiError(400, 'This request has expired');
  }

  try {
    const accepted = await finalizeAcceptance({
      requestId,
      accepterId: userId,
      requesterId: request.senderId,
      requesterEmail: request.sender.email,
    });
    return {
      message: accepted
        ? 'Friend request accepted!'
        : 'Friend request already accepted',
    };
  } catch (error) {
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

  // Backfill recipientId if the invitee had no account when it was sent.
  // Conditional so it can never overwrite an already-claimed request.
  if (!request.recipientId) {
    await prisma.friendRequest.updateMany({
      where: { id: request.id, recipientId: null },
      data: { recipientId: userId },
    });
  }

  // Same backend path as Profile → Friend Requests → Accept.
  return acceptRequest(userId, request.id);
}

export async function declineRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.recipientId !== userId) {
    throw new ApiError(400, 'Invalid request');
  }

  // Only a pending request can be declined — never flip an accepted one
  // (e.g. accepted from the email, then "Decline" clicked on a stale list),
  // which would leave a DECLINED request next to a live friendship.
  const { count } = await prisma.friendRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: { status: 'DECLINED' },
  });
  if (count === 0) {
    throw new ApiError(
      409,
      request.status === 'ACCEPTED'
        ? "You're already friends — this request was accepted"
        : 'This request has already been processed',
    );
  }
  await resolveFriendRequest(requestId, userId);

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
