/**
 * @jest-environment node
 *
 * Inbox reads/writes are scoped to the caller: a notification id alone is
 * never trusted, and links into groups the caller left are dropped.
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type AnyFn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
const fn = () => jest.fn<AnyFn>();

const mockPrisma = {
  notification: {
    findMany: fn(),
    findFirst: fn(),
    updateMany: fn(),
    count: fn(),
  },
  groupMember: { findMany: fn() },
};
jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));

/* eslint-disable @typescript-eslint/no-var-requires */
const inbox =
  require('../lib/server/services/notification') as typeof import('../lib/server/services/notification');
/* eslint-enable @typescript-eslint/no-var-requires */

const row = (id: string, groupId: string | null, createdAt: string) => ({
  id,
  type: 'EXPENSE_ADDED',
  data: {
    actorName: 'CS3A',
    groupName: 'Barkada',
    expenseName: 'Dinner',
    role: 'debtor',
    amount: 500,
    payeeName: 'CS3A',
    payeeIsActor: true,
  },
  groupId,
  expenseId: 'exp-1',
  paymentId: null,
  friendRequestId: null,
  readAt: null,
  createdAt: new Date(createdAt),
  actor: { id: 'cs3a', name: 'CS3A', picture: null },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('markRead', () => {
  it('scopes the update to the caller', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });
    await inbox.markRead('n1', 'james');
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'n1', recipientId: 'james', readAt: null },
      }),
    );
  });

  it('404s for someone else’s notification', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    await expect(inbox.markRead('n1', 'stranger')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('is a no-op for an already-read notification of yours', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.findFirst.mockResolvedValue({ id: 'n1' });
    await expect(inbox.markRead('n1', 'james')).resolves.toBeUndefined();
  });
});

describe('listNotifications', () => {
  it('drops links into groups the caller has left', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      row('n2', 'g-still-in', '2026-09-11T10:00:00Z'),
      row('n1', 'g-left', '2026-09-11T09:00:00Z'),
    ]);
    mockPrisma.groupMember.findMany.mockResolvedValue([
      { groupId: 'g-still-in' },
    ]);

    const page = await inbox.listNotifications('james');
    expect(page.items.map((i) => i.target)).toEqual([
      { kind: 'expense', groupId: 'g-still-in', expenseId: 'exp-1' },
      null,
    ]);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: 'james' },
      }),
    );
  });

  it('returns a keyset cursor only when there is another page', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      row('n3', null, '2026-09-11T11:00:00Z'),
      row('n2', null, '2026-09-11T10:00:00Z'),
    ]);
    const page = await inbox.listNotifications('james', undefined, 1);
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe('2026-09-11T11:00:00.000Z|n3');
  });

  it('rejects a malformed cursor', async () => {
    await expect(
      inbox.listNotifications('james', 'not-a-cursor'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
