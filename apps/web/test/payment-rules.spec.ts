/**
 * @jest-environment node
 *
 * Server-side payment/expense lock rules. Prisma is mocked — these pin the
 * authorization and settlement-safety decisions, not SQL.
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
    findMany: fn(),
    update: fn(),
    delete: fn(),
  },
  expense: { findUnique: fn(), update: fn(), delete: fn() },
  groupMember: { findUnique: fn() },
};

// Services are loaded with require() after the mocks are registered; ES
// imports would be hoisted above them and bind to the real Prisma client.
jest.mock('../lib/server/db', () => ({ prisma: mockPrisma }));
jest.mock('../lib/server/activity', () => ({
  logActivity: jest.fn(async () => undefined),
}));

/* eslint-disable @typescript-eslint/no-var-requires */
const payments =
  require('../lib/server/services/payment') as typeof import('../lib/server/services/payment');
const { updateExpense, removeExpense } =
  require('../lib/server/services/expense') as typeof import('../lib/server/services/expense');
/* eslint-enable @typescript-eslint/no-var-requires */

const JAMES = 'james';
const CS3A = 'cs3a';
const STRANGER = 'stranger';

/** James owes CS3A (CS3A fronted the expense). */
const authRow = (isVerified: boolean) => ({
  id: 'pay-1',
  isVerified,
  expenseSplit: {
    userId: JAMES,
    expense: { groupId: 'g1', payeeId: CS3A },
  },
});

const expectStatus = async (p: Promise<unknown>, status: number) => {
  await expect(p).rejects.toMatchObject({ statusCode: status });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation(async (cb: AnyFn) => cb(tx));
});

describe('payment create', () => {
  const split = (userId: string) => ({
    id: 'split-1',
    userId,
    amount: 10,
    payments: [],
    expense: { groupId: 'g1', payeeId: CS3A },
  });

  it('always creates unverified, even if the client sends isVerified', async () => {
    tx.expenseSplit.findUnique.mockResolvedValue(split(JAMES));
    tx.payment.create.mockResolvedValue({ id: 'pay-1' });

    await payments.create(
      { expenseSplitId: 'split-1', amountPaid: 10, isVerified: true } as never,
      JAMES,
    );

    const { data } = tx.payment.create.mock.calls[0]![0] as {
      data: { isVerified: boolean };
    };
    expect(data.isVerified).toBe(false);
  });

  it("rejects paying the payee's own share", async () => {
    tx.expenseSplit.findUnique.mockResolvedValue(split(CS3A));
    await expectStatus(
      payments.create({ expenseSplitId: 'split-1', amountPaid: 10 }, CS3A),
      400,
    );
  });
});

describe('payment verify / update', () => {
  it('lets the payee verify and stamps verifiedAt', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    mockPrisma.payment.update.mockResolvedValue({ id: 'pay-1' });

    await payments.updatePayment('pay-1', { isVerified: true }, CS3A);

    const { data } = mockPrisma.payment.update.mock.calls[0]![0] as {
      data: { isVerified: boolean; verifiedAt: Date };
    };
    expect(data.isVerified).toBe(true);
    expect(data.verifiedAt).toBeInstanceOf(Date);
  });

  it('blocks the payer from self-verifying', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    await expectStatus(
      payments.updatePayment('pay-1', { isVerified: true }, JAMES),
      403,
    );
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('locks a verified payment against edits', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(true));
    await expectStatus(
      payments.updatePayment('pay-1', { paymentMethod: 'GCASH' }, JAMES),
      409,
    );
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('treats re-verifying a verified payment as a no-op', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(true));
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay-1',
      isVerified: true,
    });

    await expect(
      payments.updatePayment('pay-1', { isVerified: true }, CS3A),
    ).resolves.toMatchObject({ isVerified: true });
    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
  });

  it('rejects unrelated users', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    await expectStatus(
      payments.updatePayment('pay-1', { isVerified: true }, STRANGER),
      403,
    );
  });
});

describe('payment delete / read', () => {
  it('refuses to delete a verified payment', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(true));
    await expectStatus(payments.remove('pay-1', JAMES), 409);
    expect(mockPrisma.payment.delete).not.toHaveBeenCalled();
  });

  it('only lets the two parties read a payment', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(authRow(false));
    await expectStatus(payments.findOne('pay-1', STRANGER), 403);
    await expect(payments.findOne('pay-1', CS3A)).resolves.toBeTruthy();
  });

  it('includes payments received as payee in the history query', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([]);
    await payments.findAll(CS3A);
    const { where } = mockPrisma.payment.findMany.mock.calls[0]![0] as {
      where: { OR: unknown[] };
    };
    expect(where.OR).toContainEqual({
      expenseSplit: { expense: { payeeId: CS3A } },
    });
  });
});

describe('expense lock', () => {
  const expenseWith = (payments: Array<{ isVerified: boolean }>) => ({
    id: 'exp-1',
    groupId: 'g1',
    payerId: JAMES,
    payeeId: CS3A,
    totalAmount: 100,
    splits: [{ id: 'split-1', payments }],
  });

  it('refuses money edits once any payment (even pending) exists', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue(
      expenseWith([{ isVerified: false }]),
    );
    await expectStatus(updateExpense('exp-1', { totalAmount: 50 }, CS3A), 409);
    expect(mockPrisma.expense.update).not.toHaveBeenCalled();
  });

  it('still allows notes-only edits on a locked expense', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue(
      expenseWith([{ isVerified: true }]),
    );
    mockPrisma.expense.update.mockResolvedValue({ groupId: 'g1' });
    await updateExpense('exp-1', { notes: 'settled in cash' }, CS3A);
    expect(mockPrisma.expense.update).toHaveBeenCalled();
  });

  it('rejects edits from non-members', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue(expenseWith([]));
    mockPrisma.groupMember.findUnique.mockResolvedValue(null);
    await expectStatus(updateExpense('exp-1', { name: 'x' }, STRANGER), 403);
  });

  it('refuses to delete an expense with verified payments', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue({
      ...expenseWith([]),
      splits: [{ payments: [{ id: 'pay-1' }] }],
    });
    await expectStatus(removeExpense('exp-1', CS3A), 409);
    expect(mockPrisma.expense.delete).not.toHaveBeenCalled();
  });
});
