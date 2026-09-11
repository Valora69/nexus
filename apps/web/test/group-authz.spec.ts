/**
 * @jest-environment node
 *
 * Group / group-member authorization: only members may add or remove other
 * members, or edit/delete the group. Anyone may remove themselves (leave).
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type AnyFn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
const fn = () => jest.fn<AnyFn>();

const mockPrisma = {
  $transaction: fn(),
  group: { update: fn(), delete: fn() },
  groupMember: { findUnique: fn(), create: fn(), delete: fn() },
  expense: { findMany: fn(), deleteMany: fn() },
  expenseSplit: { findMany: fn() },
  payment: { findMany: fn(), count: fn() },
  activity: { deleteMany: fn() },
};

jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
jest.mock('../lib/server/activity', () => ({
  logActivity: jest.fn(async () => undefined),
}));
jest.mock('../lib/server/notification-events', () => ({
  notifyGroupMembersAdded: jest.fn(async () => undefined),
}));

/* eslint-disable @typescript-eslint/no-var-requires */
const groupMembers =
  require('../lib/server/services/group-member') as typeof import('../lib/server/services/group-member');
const groups =
  require('../lib/server/services/group') as typeof import('../lib/server/services/group');
/* eslint-enable @typescript-eslint/no-var-requires */

const MEMBER = 'member';
const STRANGER = 'stranger';
const TARGET = 'target';

/** groupMember.findUnique: membership lookups by (userId, groupId) or by id. */
function mockMembership(members: string[]) {
  mockPrisma.groupMember.findUnique.mockImplementation(
    async (args: {
      where: { id?: string; GroupMemberUnique?: { userId: string } };
    }) => {
      const { where } = args;
      if (where.id) {
        return { id: where.id, userId: TARGET, groupId: 'g1' };
      }
      const userId = where.GroupMemberUnique?.userId;
      // The "is TARGET already a member" check in createGroupMember → no.
      if (userId === TARGET) return null;
      return userId && members.includes(userId) ? { id: `gm-${userId}` } : null;
    },
  );
}

const expectStatus = async (p: Promise<unknown>, status: number) => {
  await expect(p).rejects.toMatchObject({ statusCode: status });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.expenseSplit.findMany.mockResolvedValue([]);
  mockPrisma.expense.findMany.mockResolvedValue([]);
  mockPrisma.payment.findMany.mockResolvedValue([]);
  mockPrisma.payment.count.mockResolvedValue(0);
});

describe('createGroupMember', () => {
  it('rejects a non-member adding someone', async () => {
    mockMembership([MEMBER]);
    await expectStatus(
      groupMembers.createGroupMember(
        { groupId: 'g1', userId: TARGET },
        STRANGER,
      ),
      403,
    );
    expect(mockPrisma.groupMember.create).not.toHaveBeenCalled();
  });

  it('lets a member add someone', async () => {
    mockMembership([MEMBER]);
    mockPrisma.groupMember.create.mockResolvedValue({
      id: 'gm-new',
      groupId: 'g1',
      userId: TARGET,
    });
    await groupMembers.createGroupMember(
      { groupId: 'g1', userId: TARGET },
      MEMBER,
    );
    expect(mockPrisma.groupMember.create).toHaveBeenCalled();
  });
});

describe('removeGroupMember', () => {
  it('rejects a non-member removing someone else', async () => {
    mockMembership([MEMBER]);
    await expectStatus(groupMembers.removeGroupMember('gm-t', STRANGER), 403);
    expect(mockPrisma.groupMember.delete).not.toHaveBeenCalled();
  });

  it('lets a member remove someone else', async () => {
    mockMembership([MEMBER]);
    mockPrisma.groupMember.delete.mockResolvedValue({
      id: 'gm-t',
      groupId: 'g1',
    });
    const result = await groupMembers.removeGroupMember('gm-t', MEMBER);
    expect(result.blocked).toBe(false);
  });

  it('lets anyone remove themselves (leave)', async () => {
    mockMembership([]);
    mockPrisma.groupMember.delete.mockResolvedValue({
      id: 'gm-t',
      groupId: 'g1',
    });
    const result = await groupMembers.removeGroupMember('gm-t', TARGET);
    expect(result.blocked).toBe(false);
  });
});

describe('updateGroup / removeGroup', () => {
  it('rejects a non-member renaming the group', async () => {
    mockMembership([MEMBER]);
    await expectStatus(groups.updateGroup('g1', { name: 'x' }, STRANGER), 403);
    expect(mockPrisma.group.update).not.toHaveBeenCalled();
  });

  it('lets a member rename the group', async () => {
    mockMembership([MEMBER]);
    mockPrisma.group.update.mockResolvedValue({ id: 'g1', name: 'x' });
    await groups.updateGroup('g1', { name: 'x' }, MEMBER);
    expect(mockPrisma.group.update).toHaveBeenCalled();
  });

  it('rejects a non-member deleting the group', async () => {
    mockMembership([MEMBER]);
    await expectStatus(groups.removeGroup('g1', STRANGER), 403);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
