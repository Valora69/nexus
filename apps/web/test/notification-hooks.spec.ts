/**
 * @jest-environment node
 *
 * Services fire notification events only after a successful write, only on
 * real state transitions, and never on idempotent replays.
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

type AnyFn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
const fn = () => jest.fn<AnyFn>();

const tx = {
  $queryRaw: fn(),
  expenseSplit: { findUnique: fn() },
  payment: { create: fn() },
};
const mockPrisma = {
  $transaction: fn(),
  payment: {
    findUnique: fn(),
    findUniqueOrThrow: fn(),
    update: fn(),
    delete: fn(),
  },
  expense: { findUnique: fn(), delete: fn() },
  groupMember: { findUnique: fn() },
};

const commitWithdrawn = fn();
const commitDeleted = fn();
const events = {
  notifyPaymentRecorded: fn(),
  notifyPaymentVerified: fn(),
  preparePaymentWithdrawn: fn(),
  prepareExpenseDeleted: fn(),
  notifyExpenseCreated: fn(),
  notifyExpensesCreated: fn(),
  notifyExpenseUpdated: fn(),
  notifyGroupMembersAdded: fn(),
  notifyFriendRequest: fn(),
  notifyFriendAccepted: fn(),
  resolveFriendRequest: fn(),
};

jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
jest.mock('../lib/server/activity', () => ({
  logActivity: jest.fn(async () => undefined),
}));
jest.mock('../lib/server/notification-events', () => events);

/* eslint-disable @typescript-eslint/no-var-requires */
const payments =
  require('../lib/server/services/payment') as typeof import('../lib/server/services/payment');
const { removeExpense } =
  require('../lib/server/services/expense') as typeof import('../lib/server/services/expense');
/* eslint-enable @typescript-eslint/no-var-requires */

const JAMES = 'james';
const CS3A = 'cs3a';

const split = {
  id: 'split-1',
  userId: JAMES,
  amount: 500,
  payments: [],
  expense: { groupId: 'g1', payeeId: CS3A },
};
const authRow = (isVerified: boolean) => ({
  id: 'pay-1',
  isVerified,
  expenseSplit: { userId: JAMES, expense: { groupId: 'g1', payeeId: CS3A } },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: AnyFn) => cb(tx));
  events.preparePaymentWithdrawn.mockResolvedValue(commitWithdrawn);
  events.prepareExpenseDeleted.mockResolvedValue(commitDeleted);
});

describe('payment create', () => {
  it('notifies the payee after a successful payment', async () => {
    tx.expenseSplit.findUnique.mockResolvedValue(split);
    tx.payment.create.mockResolvedValue({ id: 'pay-1' });

    await payments.create(
      { expenseSplitId: 'split-1', amountPaid: 500, paymentMethod: 'CASH' },
      JAMES,
    );
    expect(events.notifyPaymentRecorded).toHaveBeenCalledWith('pay-1', JAMES);
  });

  it('does not re-notify on an outbox replay', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay-1' });

    const result = await payments.create(
      { expenseSplitId: 'split-1', amountPaid: 500, paymentMethod: 'CASH' },
      JAMES,
      'client-req-1',
    );
    expect(result.replayed).toBe(true);
    expect(events.notifyPaymentRecorded).not.toHaveBeenCalled();
  });

  it('does not notify when the payment is rejected', async () => {
    tx.expenseSplit.findUnique.mockResolvedValue(split);

    await expect(
      payments.create(
        { expenseSplitId: 'split-1', amountPaid: 900, paymentMethod: 'CASH' },
        JAMES,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(events.notifyPaymentRecorded).not.toHaveBeenCalled();
  });
});

describe('payment verify', () => {
  it('notifies on the unverified → verified transition', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    mockPrisma.payment.update.mockResolvedValue({ id: 'pay-1' });

    await payments.updatePayment('pay-1', { isVerified: true }, CS3A);
    expect(events.notifyPaymentVerified).toHaveBeenCalledWith('pay-1', CS3A);
  });

  it('stays silent on a re-verify no-op', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(true));
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue({ id: 'pay-1' });

    await payments.updatePayment('pay-1', { isVerified: true }, CS3A);
    expect(events.notifyPaymentVerified).not.toHaveBeenCalled();
  });

  it('stays silent when the payer edits method/proof', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    mockPrisma.payment.update.mockResolvedValue({ id: 'pay-1' });

    await payments.updatePayment('pay-1', { paymentMethod: 'GCASH' }, JAMES);
    expect(events.notifyPaymentVerified).not.toHaveBeenCalled();
  });
});

describe('two-phase deletes', () => {
  it('prepares before deleting a payment and commits after', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    mockPrisma.payment.delete.mockResolvedValue({ id: 'pay-1' });

    await payments.remove('pay-1', JAMES);
    expect(events.preparePaymentWithdrawn).toHaveBeenCalledWith('pay-1', JAMES);
    expect(commitWithdrawn).toHaveBeenCalled();
    const prepareOrder =
      events.preparePaymentWithdrawn.mock.invocationCallOrder[0] ?? 0;
    const deleteOrder = mockPrisma.payment.delete.mock.invocationCallOrder[0];
    expect(prepareOrder).toBeLessThan(deleteOrder ?? 0);
  });

  it('does not commit when the payment delete fails', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    mockPrisma.payment.delete.mockRejectedValue(new Error('db down'));

    await expect(payments.remove('pay-1', JAMES)).rejects.toMatchObject({
      statusCode: 500,
    });
    expect(commitWithdrawn).not.toHaveBeenCalled();
  });

  it('prepares before deleting an expense and commits after', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue({
      id: 'exp-1',
      groupId: 'g1',
      payerId: JAMES,
      payeeId: CS3A,
      splits: [{ payments: [] }],
    });
    mockPrisma.expense.delete.mockResolvedValue({ id: 'exp-1', groupId: 'g1' });

    await removeExpense('exp-1', CS3A);
    expect(events.prepareExpenseDeleted).toHaveBeenCalledWith('exp-1', CS3A);
    expect(commitDeleted).toHaveBeenCalled();
  });
});
