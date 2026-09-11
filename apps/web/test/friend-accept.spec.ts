/**
 * @jest-environment node
 *
 * Friend requests have one source of truth: the email link and the Profile
 * accept button both go through the same atomic PENDING → ACCEPTED flip, so
 * reopened links, double clicks and races can't duplicate or revert state.
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type AnyFn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
const fn = () => jest.fn<AnyFn>();

const tx = {
  friendRequest: { updateMany: fn() },
  friendship: { createMany: fn() },
};
const mockPrisma = {
  $transaction: fn(),
  user: { findUnique: fn() },
  friendship: { findFirst: fn() },
  friendRequest: {
    findUnique: fn(),
    findFirst: fn(),
    create: fn(),
    update: fn(),
    updateMany: fn(),
  },
};
const events = {
  notifyFriendAccepted: fn(),
  notifyFriendRequest: fn(),
  resolveFriendRequest: fn(),
};

jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
jest.mock('../lib/server/notification-events', () => events);
jest.mock('../lib/server/email', () => ({
  sendFriendRequestEmail: jest.fn(async () => undefined),
}));
jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));

/* eslint-disable @typescript-eslint/no-var-requires */
const friends =
  require('../lib/server/services/friend') as typeof import('../lib/server/services/friend');
/* eslint-enable @typescript-eslint/no-var-requires */

const JAMES = { id: 'james', email: 'james@example.com', name: 'James' };
const CS3A = { id: 'cs3a', email: 'cs3a@example.com', name: 'CS3A' };

/** James → CS3A, sent via email invite. */
const request = (overrides: Record<string, unknown> = {}) => ({
  id: 'req-1',
  senderId: JAMES.id,
  sender: JAMES,
  recipientEmail: CS3A.email,
  recipientId: CS3A.id,
  status: 'PENDING',
  token: 'tok-1',
  expiresAt: new Date(Date.now() + 86_400_000),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: AnyFn) => cb(tx));
  mockPrisma.user.findUnique.mockResolvedValue({ email: CS3A.email });
});

describe('accepting from the email link', () => {
  it('uses the shared acceptance path: flips, befriends both ways, notifies once', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue(request());
    tx.friendRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await friends.acceptRequestByToken(CS3A.id, 'tok-1');

    expect(result.message).toBe('Friend request accepted!');
    // Conditional flip — the atomic source of truth.
    expect(tx.friendRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'req-1', status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    expect(tx.friendship.createMany).toHaveBeenCalledWith({
      data: [
        { userId: JAMES.id, friendId: CS3A.id },
        { userId: CS3A.id, friendId: JAMES.id },
      ],
      skipDuplicates: true,
    });
    // CS3A's own pending request to James (if any) is settled too.
    expect(tx.friendRequest.updateMany).toHaveBeenCalledWith({
      where: {
        senderId: CS3A.id,
        recipientEmail: JAMES.email,
        status: 'PENDING',
      },
      data: { status: 'ACCEPTED' },
    });
    expect(events.notifyFriendAccepted).toHaveBeenCalledTimes(1);
  });

  it('is a no-op success when the link is reopened after accepting — even past expiry', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue(
      request({ status: 'ACCEPTED', expiresAt: new Date(Date.now() - 1000) }),
    );

    const result = await friends.acceptRequestByToken(CS3A.id, 'tok-1');

    expect(result.message).toBe('Friend request already accepted');
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(events.notifyFriendAccepted).not.toHaveBeenCalled();
  });

  it('rejects a different signed-in account', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue(request());
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'someone@else.com' });

    await expect(
      friends.acceptRequestByToken('someone', 'tok-1'),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('claims an invite sent before the recipient had an account, without overwriting', async () => {
    mockPrisma.friendRequest.findUnique
      .mockResolvedValueOnce(request({ recipientId: null }))
      .mockResolvedValueOnce(request());
    tx.friendRequest.updateMany.mockResolvedValue({ count: 1 });

    await friends.acceptRequestByToken(CS3A.id, 'tok-1');

    expect(mockPrisma.friendRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'req-1', recipientId: null },
      data: { recipientId: CS3A.id },
    });
  });
});

describe('concurrent accepts (email link + Profile button)', () => {
  it('the loser neither re-inserts friendships nor re-notifies', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue(request());
    // Another request already flipped it between our read and our write.
    tx.friendRequest.updateMany.mockResolvedValue({ count: 0 });

    const result = await friends.acceptRequest(CS3A.id, 'req-1');

    expect(result.message).toBe('Friend request already accepted');
    expect(tx.friendship.createMany).not.toHaveBeenCalled();
    expect(events.notifyFriendAccepted).not.toHaveBeenCalled();
  });
});

describe('declining', () => {
  it('cannot flip an accepted request back', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue(
      request({ status: 'ACCEPTED' }),
    );
    mockPrisma.friendRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      friends.declineRequest(CS3A.id, 'req-1'),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mockPrisma.friendRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'req-1', status: 'PENDING' },
      data: { status: 'DECLINED' },
    });
  });
});

describe('sending', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockImplementation(
      async (args: { where: { id?: string; email?: string } }) =>
        args.where.id === JAMES.id
          ? JAMES
          : args.where.email === CS3A.email
            ? CS3A
            : null,
    );
    mockPrisma.friendship.findFirst.mockResolvedValue(null);
    mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
  });

  it('reuses a declined request (new token) instead of hitting the unique index', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'DECLINED',
      expiresAt: new Date(Date.now() - 1000),
    });
    mockPrisma.friendRequest.updateMany.mockResolvedValue({ count: 1 });

    await friends.sendFriendRequest(JAMES.id, CS3A.email);

    expect(mockPrisma.friendRequest.create).not.toHaveBeenCalled();
    const call = mockPrisma.friendRequest.updateMany.mock.calls[0]?.[0] as {
      data: { status: string; token: string };
    };
    expect(call.data.status).toBe('PENDING');
    expect(call.data.token).not.toBe('tok-1');
    expect(events.notifyFriendRequest).toHaveBeenCalledWith(
      'req-1',
      JAMES.id,
      CS3A.id,
    );
  });

  it('lets only one of two concurrent re-sends reuse the row', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'DECLINED',
      expiresAt: new Date(Date.now() - 1000),
    });
    // The other send already flipped it back to a live PENDING row.
    mockPrisma.friendRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      friends.sendFriendRequest(JAMES.id, CS3A.email),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(events.notifyFriendRequest).not.toHaveBeenCalled();
  });

  it('still blocks a live duplicate', async () => {
    mockPrisma.friendRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await expect(
      friends.sendFriendRequest(JAMES.id, CS3A.email),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
