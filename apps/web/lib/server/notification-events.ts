import { prisma } from '@/lib/server/db';
import {
  notify,
  notifyExpenseUpdates,
  resolveNotifications,
  retractNotifications,
  safely,
  type NotifyInput,
} from '@/lib/server/notifications';
import {
  expenseCreatedInputs,
  expenseDeletedInputs,
  expensesCreatedInputs,
  expenseUpdatedInputs,
  type Actor,
  type ExpenseSnapshotInput,
} from '@/lib/server/notification-builders';

/**
 * One entry point per business event, called by services *after* the write
 * commits. Each does its own small lookups so services stay a one-liner,
 * and every step is non-critical: failures are logged, never thrown.
 *
 * Deletes are two-phase (`prepare…` before, returned `commit` after): the
 * entity FKs on Notification are SET NULL, so anything we need to know about
 * the doomed row must be read before it goes.
 */

type Commit = () => Promise<void>;
const noop: Commit = async () => undefined;

async function loadActor(userId: string): Promise<Actor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return { id: userId, name: user?.name ?? 'Someone' };
}

const EXPENSE_SNAPSHOT_SELECT = {
  id: true,
  name: true,
  groupId: true,
  payeeId: true,
  group: { select: { name: true } },
  payee: { select: { name: true } },
  splits: { select: { userId: true, amount: true } },
} as const;

async function loadExpenseSnapshots(
  ids: string[],
): Promise<ExpenseSnapshotInput[]> {
  const rows = await prisma.expense.findMany({
    where: { id: { in: ids } },
    select: EXPENSE_SNAPSHOT_SELECT,
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    groupId: row.groupId,
    groupName: row.group.name,
    payeeId: row.payeeId,
    payeeName: row.payee?.name ?? 'someone',
    splits: row.splits,
  }));
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export async function notifyExpensesCreated(
  expenseIds: string[],
  actorId: string,
): Promise<void> {
  if (expenseIds.length === 0) return;
  const inputs = await safely('build expense created', async () => {
    const [actor, expenses] = await Promise.all([
      loadActor(actorId),
      loadExpenseSnapshots(expenseIds),
    ]);
    return expenses.length === 1 && expenses[0]
      ? expenseCreatedInputs(expenses[0], actor)
      : expensesCreatedInputs(expenses, actor);
  });
  if (inputs) await notify(inputs);
}

export const notifyExpenseCreated = (expenseId: string, actorId: string) =>
  notifyExpensesCreated([expenseId], actorId);

export interface ExpenseStakeState {
  payeeId: string | null;
  splits: Array<{ userId: string; amount: number }>;
}

/** Notify only people whose stake changed; coalesces repeated edits. */
export async function notifyExpenseUpdated(
  before: ExpenseStakeState,
  expenseId: string,
  actorId: string,
): Promise<void> {
  const inputs = await safely('build expense updated', async () => {
    const [actor, [after]] = await Promise.all([
      loadActor(actorId),
      loadExpenseSnapshots([expenseId]),
    ]);
    return after ? expenseUpdatedInputs(before, after, actor) : [];
  });
  if (inputs && inputs.length > 0) await notifyExpenseUpdates(inputs);
}

export async function prepareExpenseDeleted(
  expenseId: string,
  actorId: string,
): Promise<Commit> {
  const prep = await safely('prepare expense deleted', async () => {
    const [actor, [expense], unread] = await Promise.all([
      loadActor(actorId),
      loadExpenseSnapshots([expenseId]),
      loadUnread({ expenseId }),
    ]);
    return { actor, expense, unread };
  });
  if (!prep?.expense) return noop;
  const { actor, expense, unread } = prep;

  return async () => {
    // Unseen notifications about this expense (including "confirm receipt"
    // for its cascade-deleted pending payments) are moot now.
    await retractNotifications(unread.map((n) => n.id));
    // Never saw it added → no need to hear it's gone.
    const neverSawIt = new Set(
      unread
        .filter((n) => n.type === 'EXPENSE_ADDED')
        .map((n) => n.recipientId),
    );
    await notify(
      expenseDeletedInputs(expense, actor).filter(
        (i) => !neverSawIt.has(i.recipientId),
      ),
    );
  };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const PAYMENT_SNAPSHOT_SELECT = {
  id: true,
  amountPaid: true,
  paymentMethod: true,
  expenseSplit: {
    select: {
      userId: true,
      amount: true,
      payments: { select: { amountPaid: true, isVerified: true } },
      expense: {
        select: {
          id: true,
          name: true,
          groupId: true,
          payeeId: true,
          group: { select: { name: true } },
        },
      },
    },
  },
} as const;

// Lookups are `async` functions (not bare Prisma calls) so any failure is a
// rejection Promise.all handles, never a synchronous throw that would strand
// a sibling lookup's rejection as unhandled.
async function loadPayment(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    select: PAYMENT_SNAPSHOT_SELECT,
  });
}

async function loadUnread(where: {
  expenseId?: string;
  paymentId?: string;
  type?: 'PAYMENT_RECORDED';
}) {
  return prisma.notification.findMany({
    where: { ...where, readAt: null },
    select: { id: true, recipientId: true, type: true },
  });
}

async function loadGroupName(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true },
  });
  return group?.name ?? null;
}

/** Debtor recorded a payment → the payee is asked to confirm receipt. */
export async function notifyPaymentRecorded(
  paymentId: string,
  actorId: string,
): Promise<void> {
  const inputs = await safely('build payment recorded', async () => {
    const [actor, payment] = await Promise.all([
      loadActor(actorId),
      loadPayment(paymentId),
    ]);
    const split = payment?.expenseSplit;
    const expense = split?.expense;
    if (!payment || !split || !expense?.payeeId) return [];

    const claimed = split.payments.reduce((s, p) => s + p.amountPaid, 0);
    const input: NotifyInput = {
      type: 'PAYMENT_RECORDED',
      recipientId: expense.payeeId,
      actorId,
      groupId: expense.groupId,
      expenseId: expense.id,
      paymentId,
      data: {
        actorName: actor.name,
        groupName: expense.group.name,
        expenseName: expense.name,
        amount: payment.amountPaid,
        method: payment.paymentMethod,
        shareAmount: split.amount,
        remainingAfter: Math.max(0, split.amount - claimed),
      },
    };
    return [input];
  });
  if (inputs) await notify(inputs);
}

/**
 * Payee confirmed receipt (unverified → verified only). Resolves their
 * "confirm receipt" prompt and tells the debtor, folding "you're settled"
 * into the same message.
 */
export async function notifyPaymentVerified(
  paymentId: string,
  actorId: string,
): Promise<void> {
  await resolveNotifications({
    recipientId: actorId,
    paymentId,
    type: 'PAYMENT_RECORDED',
  });

  const inputs = await safely('build payment verified', async () => {
    const [actor, payment] = await Promise.all([
      loadActor(actorId),
      loadPayment(paymentId),
    ]);
    const split = payment?.expenseSplit;
    if (!payment || !split) return [];
    const expense = split.expense;

    const verified = split.payments
      .filter((p) => p.isVerified)
      .reduce((s, p) => s + p.amountPaid, 0);
    const input: NotifyInput = {
      type: 'PAYMENT_CONFIRMED',
      recipientId: split.userId,
      actorId,
      groupId: expense.groupId,
      expenseId: expense.id,
      paymentId,
      data: {
        actorName: actor.name,
        groupName: expense.group.name,
        expenseName: expense.name,
        amount: payment.amountPaid,
        splitSettled: verified >= split.amount - 0.01,
        remaining: Math.max(0, split.amount - verified),
      },
    };
    return [input];
  });
  if (inputs) await notify(inputs);
}

/**
 * Debtor withdrew an unverified payment. If the payee never saw the
 * "paid you" notification, just retract it; otherwise tell them.
 */
export async function preparePaymentWithdrawn(
  paymentId: string,
  actorId: string,
): Promise<Commit> {
  const prep = await safely('prepare payment withdrawn', async () => {
    const [actor, payment, unread] = await Promise.all([
      loadActor(actorId),
      loadPayment(paymentId),
      loadUnread({ paymentId, type: 'PAYMENT_RECORDED' }),
    ]);
    return { actor, payment, unread };
  });
  const expense = prep?.payment?.expenseSplit.expense;
  if (!prep?.payment || !expense?.payeeId) return noop;
  const { actor, payment, unread } = prep;
  const payeeId = expense.payeeId;

  return async () => {
    if (unread.length > 0) {
      await retractNotifications(unread.map((n) => n.id));
      return;
    }
    await notify([
      {
        type: 'PAYMENT_WITHDRAWN',
        recipientId: payeeId,
        actorId,
        groupId: expense.groupId,
        expenseId: expense.id,
        data: {
          actorName: actor.name,
          groupName: expense.group.name,
          expenseName: expense.name,
          amount: payment.amountPaid,
        },
      },
    ]);
  };
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export async function notifyGroupMembersAdded(
  groupId: string,
  userIds: string[],
  actorId: string,
): Promise<void> {
  if (userIds.length === 0) return;
  const inputs = await safely('build group members added', async () => {
    const [actor, groupName] = await Promise.all([
      loadActor(actorId),
      loadGroupName(groupId),
    ]);
    if (!groupName) return [];
    return userIds.map((recipientId): NotifyInput => ({
      type: 'GROUP_ADDED',
      recipientId,
      actorId,
      groupId,
      data: { actorName: actor.name, groupName },
    }));
  });
  if (inputs) await notify(inputs);
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export async function notifyFriendRequest(
  requestId: string,
  senderId: string,
  recipientId: string,
): Promise<void> {
  const actor = await safely('load friend request actor', () =>
    loadActor(senderId),
  );
  if (!actor) return;
  await notify([
    {
      type: 'FRIEND_REQUEST',
      recipientId,
      actorId: senderId,
      friendRequestId: requestId,
      data: { actorName: actor.name },
    },
  ]);
}

/**
 * `accepterId` accepted a request from `requesterId` (or a mutual request
 * auto-accepted). Resolves any pending request prompts between the two and
 * tells the requester.
 */
export async function notifyFriendAccepted(
  requestId: string,
  accepterId: string,
  requesterId: string,
): Promise<void> {
  await Promise.all([
    resolveNotifications({
      recipientId: accepterId,
      actorId: requesterId,
      type: 'FRIEND_REQUEST',
    }),
    resolveNotifications({
      recipientId: requesterId,
      actorId: accepterId,
      type: 'FRIEND_REQUEST',
    }),
  ]);

  const actor = await safely('load friend accept actor', () =>
    loadActor(accepterId),
  );
  if (!actor) return;
  await notify([
    {
      type: 'FRIEND_ACCEPTED',
      recipientId: requesterId,
      actorId: accepterId,
      friendRequestId: requestId,
      data: { actorName: actor.name },
    },
  ]);
}

/** Declining sends nothing (deliberately), but resolves the prompt. */
export async function resolveFriendRequest(
  requestId: string,
  recipientId: string,
): Promise<void> {
  await resolveNotifications({
    recipientId,
    friendRequestId: requestId,
    type: 'FRIEND_REQUEST',
  });
}
