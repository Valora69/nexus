/**
 * @jest-environment node
 *
 * Notification persistence: never notify the actor, never throw, and fold
 * repeated expense edits into one unread row.
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type AnyFn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
const fn = () => jest.fn<AnyFn>();

const mockPrisma = {
  notification: {
    createMany: fn(),
    findFirst: fn(),
    update: fn(),
    delete: fn(),
    updateMany: fn(),
    deleteMany: fn(),
  },
};
jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));

/* eslint-disable @typescript-eslint/no-var-requires */
const { notify, notifyExpenseUpdates } =
  require('../lib/server/notifications') as typeof import('../lib/server/notifications');
/* eslint-enable @typescript-eslint/no-var-requires */

const update = (from: number, to: number) => ({
  type: 'EXPENSE_UPDATED' as const,
  recipientId: 'james',
  actorId: 'cs3a',
  groupId: 'g1',
  expenseId: 'exp-1',
  dedupeKey: 'expense-updated:exp-1',
  data: {
    actorName: 'CS3A',
    groupName: 'Barkada',
    expenseName: 'Dinner',
    change: {
      kind: 'share_changed' as const,
      role: 'debtor' as const,
      from,
      to,
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('notify', () => {
  it('drops rows addressed to the actor', async () => {
    await notify([
      {
        type: 'GROUP_ADDED',
        recipientId: 'cs3a',
        actorId: 'cs3a',
        data: { actorName: 'CS3A', groupName: 'Barkada' },
      },
    ]);
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('swallows database failures', async () => {
    mockPrisma.notification.createMany.mockRejectedValue(new Error('db down'));
    await expect(
      notify([
        {
          type: 'GROUP_ADDED',
          recipientId: 'james',
          actorId: 'cs3a',
          data: { actorName: 'CS3A', groupName: 'Barkada' },
        },
      ]),
    ).resolves.toBeUndefined();
  });
});

describe('notifyExpenseUpdates', () => {
  it('creates a row when there is no unread update to fold into', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    await notifyExpenseUpdates([update(400, 450)]);
    expect(mockPrisma.notification.createMany).toHaveBeenCalledTimes(1);
  });

  it('folds into the unread row: original from, latest to', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: 'n1',
      data: update(400, 450).data,
    });
    await notifyExpenseUpdates([update(450, 500)]);

    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    const call = mockPrisma.notification.update.mock.calls[0]?.[0] as {
      where: { id: string };
      data: { data: { change: unknown } };
    };
    expect(call.where.id).toBe('n1');
    expect(call.data.data.change).toEqual({
      kind: 'share_changed',
      role: 'debtor',
      from: 400,
      to: 500,
    });
  });

  it('deletes the unread row when edits cancel out', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: 'n1',
      data: update(400, 500).data,
    });
    await notifyExpenseUpdates([update(500, 400)]);

    expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
      where: { id: 'n1' },
    });
    expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
  });
});
