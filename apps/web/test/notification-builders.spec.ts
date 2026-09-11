/**
 * @jest-environment node
 *
 * Pure notification rules: who is told what for each event, how repeated
 * edits coalesce, and how the shared formatter/target resolver render them.
 */
import { describe, it, expect } from '@jest/globals';

import {
  diffStake,
  expenseCreatedInputs,
  expenseDeletedInputs,
  expensesCreatedInputs,
  expenseStakes,
  expenseUpdatedInputs,
  mergeExpenseChanges,
  type ExpenseSnapshotInput,
} from '../lib/server/notification-builders';
import {
  formatNotification,
  notificationTarget,
} from '@repo/shared/utils/notifications';

const JAMES = { id: 'james', name: 'James' };
const CS3A = { id: 'cs3a', name: 'CS3A' };

/** CS3A fronted ₱1,500 dinner; James and Ana owe ₱500 each. */
const dinner = (
  overrides: Partial<ExpenseSnapshotInput> = {},
): ExpenseSnapshotInput => ({
  id: 'exp-1',
  name: 'Dinner',
  groupId: 'g1',
  groupName: 'Barkada',
  payeeId: CS3A.id,
  payeeName: CS3A.name,
  splits: [
    { userId: CS3A.id, amount: 500 },
    { userId: JAMES.id, amount: 500 },
    { userId: 'ana', amount: 500 },
  ],
  ...overrides,
});

describe('expenseStakes', () => {
  it('excludes the payee’s own share and totals what they are owed', () => {
    const stakes = expenseStakes(dinner());
    expect(stakes.get(JAMES.id)).toEqual({ role: 'debtor', amount: 500 });
    expect(stakes.get(CS3A.id)).toEqual({ role: 'payee', amount: 1000 });
  });

  it('ignores zero shares and payee-less legacy expenses', () => {
    const zero = dinner({
      splits: [
        { userId: CS3A.id, amount: 1500 },
        { userId: JAMES.id, amount: 0 },
      ],
    });
    expect(expenseStakes(zero).size).toBe(0);
    expect(expenseStakes(dinner({ payeeId: null })).size).toBe(0);
  });
});

describe('expenseCreatedInputs', () => {
  it('tells each debtor what they owe and the payee what they are owed', () => {
    const inputs = expenseCreatedInputs(dinner(), JAMES);
    const byRecipient = Object.fromEntries(
      inputs.map((i) => [i.recipientId, i]),
    );
    expect(byRecipient.ana).toMatchObject({
      type: 'EXPENSE_ADDED',
      expenseId: 'exp-1',
      data: { role: 'debtor', amount: 500, payeeName: 'CS3A' },
    });
    expect(byRecipient.cs3a).toMatchObject({
      data: { role: 'payee', amount: 1000 },
    });
    // The actor's own row is built but filtered by notify(); the recipient
    // set here is simply "everyone with a stake".
    expect(byRecipient.james?.actorId).toBe(JAMES.id);
  });

  it('collapses a bulk create into one row per recipient per group', () => {
    const lunch = dinner({ id: 'exp-2', name: 'Lunch' });
    const out = expensesCreatedInputs([dinner(), lunch], CS3A);
    const ana = out.filter((i) => i.recipientId === 'ana');
    expect(ana).toHaveLength(1);
    expect(ana[0]).toMatchObject({
      expenseId: null,
      data: { count: 2, role: 'debtor', amount: 1000 },
    });
  });
});

describe('expenseUpdatedInputs', () => {
  it('notifies only people whose stake changed, with from → to', () => {
    const after = dinner({
      splits: [
        { userId: CS3A.id, amount: 400 },
        { userId: JAMES.id, amount: 600 },
        { userId: 'ana', amount: 500 },
      ],
    });
    const inputs = expenseUpdatedInputs(dinner(), after, CS3A);
    const recipients = inputs.map((i) => i.recipientId).sort();
    // Ana's share didn't move; CS3A is owed 1,100 instead of 1,000.
    expect(recipients).toEqual(['cs3a', 'james']);
    const james = inputs.find((i) => i.recipientId === 'james');
    expect(james?.data.change).toEqual({
      kind: 'share_changed',
      role: 'debtor',
      from: 500,
      to: 600,
    });
    expect(james?.dedupeKey).toBe('expense-updated:exp-1');
  });

  it('reports added and removed participants', () => {
    const after = dinner({
      splits: [
        { userId: CS3A.id, amount: 500 },
        { userId: JAMES.id, amount: 500 },
        { userId: 'ben', amount: 500 },
      ],
    });
    const inputs = expenseUpdatedInputs(dinner(), after, CS3A);
    const change = (id: string) =>
      inputs.find((i) => i.recipientId === id)?.data.change;
    expect(change('ana')).toEqual({
      kind: 'removed',
      role: 'debtor',
      amount: 500,
    });
    expect(change('ben')).toEqual({
      kind: 'added',
      role: 'debtor',
      amount: 500,
    });
    expect(change('james')).toBeUndefined();
  });

  it('tells debtors who they now owe when only the payee changes', () => {
    const after = dinner({ payeeId: 'ana', payeeName: 'Ana' });
    const inputs = expenseUpdatedInputs(dinner(), after, JAMES);
    const james = inputs.find((i) => i.recipientId === 'james');
    expect(james?.data.change).toEqual({
      kind: 'payee_changed',
      payeeName: 'Ana',
      amount: 500,
    });
  });

  it('sends nothing for name/notes-only edits', () => {
    const after = dinner({ name: 'Team dinner' });
    expect(expenseUpdatedInputs(dinner(), after, CS3A)).toEqual([]);
  });
});

describe('mergeExpenseChanges (coalescing repeated edits)', () => {
  it('keeps the original from and the latest to', () => {
    const merged = mergeExpenseChanges(
      { kind: 'share_changed', role: 'debtor', from: 400, to: 450 },
      { kind: 'share_changed', role: 'debtor', from: 450, to: 500 },
    );
    expect(merged).toEqual({
      kind: 'share_changed',
      role: 'debtor',
      from: 400,
      to: 500,
    });
  });

  it('returns null when edits cancel out', () => {
    expect(
      mergeExpenseChanges(
        { kind: 'share_changed', role: 'debtor', from: 400, to: 500 },
        { kind: 'share_changed', role: 'debtor', from: 500, to: 400 },
      ),
    ).toBeNull();
    expect(
      mergeExpenseChanges(
        { kind: 'added', role: 'debtor', amount: 300 },
        { kind: 'removed', role: 'debtor', amount: 300 },
      ),
    ).toBeNull();
  });

  it('turns remove-then-re-add at a new amount into a share change', () => {
    expect(
      mergeExpenseChanges(
        { kind: 'removed', role: 'debtor', amount: 500 },
        { kind: 'added', role: 'debtor', amount: 700 },
      ),
    ).toEqual({ kind: 'share_changed', role: 'debtor', from: 500, to: 700 });
  });
});

describe('diffStake', () => {
  it('treats a role flip as a new stake', () => {
    expect(
      diffStake(
        { role: 'debtor', amount: 500 },
        { role: 'payee', amount: 1000 },
      ),
    ).toEqual({ kind: 'added', role: 'payee', amount: 1000 });
  });
});

describe('expenseDeletedInputs', () => {
  it('links to the group, since the expense is gone', () => {
    const inputs = expenseDeletedInputs(dinner(), CS3A);
    const james = inputs.find((i) => i.recipientId === 'james');
    expect(james).toMatchObject({
      type: 'EXPENSE_DELETED',
      groupId: 'g1',
      data: { role: 'debtor', amount: 500 },
    });
    expect(james?.expenseId).toBeUndefined();
  });
});

describe('formatNotification', () => {
  it('renders a partial payment with the share and a confirm prompt', () => {
    const f = formatNotification({
      type: 'PAYMENT_RECORDED',
      actor: { name: 'James' },
      data: {
        actorName: 'James',
        groupName: 'Barkada',
        expenseName: 'Dinner',
        amount: 300,
        method: 'GCASH',
        shareAmount: 500,
        remainingAfter: 200,
      },
    });
    expect(f.actor).toBe('James');
    expect(f.text).toBe(
      'paid you ₱300.00 of ₱500.00 for Dinner — confirm receipt',
    );
    expect(f.context).toBe('GCash · Barkada');
    expect(f.amount).toEqual({ value: 300, direction: 'in' });
  });

  it('folds settlement into the confirmation message', () => {
    const f = formatNotification({
      type: 'PAYMENT_CONFIRMED',
      data: {
        actorName: 'CS3A',
        groupName: 'Barkada',
        expenseName: 'Dinner',
        amount: 500,
        splitSettled: true,
        remaining: 0,
      },
    });
    expect(f.text).toBe(
      "confirmed your payment — you're all settled for Dinner",
    );
  });

  it('shows the specific share change, not a generic update', () => {
    const f = formatNotification({
      type: 'EXPENSE_UPDATED',
      data: {
        actorName: 'CS3A',
        groupName: 'Barkada',
        expenseName: 'Dinner',
        change: { kind: 'share_changed', role: 'debtor', from: 400, to: 500 },
      },
    });
    expect(f.text).toBe('changed your share: ₱400.00 → ₱500.00');
    expect(f.context).toBe('Dinner · Barkada');
  });
});

describe('notificationTarget', () => {
  const base = { groupId: 'g1', expenseId: 'e1', paymentId: 'p1' };

  it('sends a payee straight to verification', () => {
    expect(
      notificationTarget({
        ...base,
        type: 'PAYMENT_RECORDED',
        data: {} as never,
      }),
    ).toEqual({ kind: 'verifyPayment', paymentId: 'p1' });
  });

  it('falls back to the group when the expense is gone', () => {
    expect(
      notificationTarget({
        ...base,
        expenseId: null,
        type: 'PAYMENT_CONFIRMED',
        data: {} as never,
      }),
    ).toEqual({ kind: 'group', groupId: 'g1' });
  });

  it('links removals to the group, not the expense', () => {
    expect(
      notificationTarget({
        ...base,
        type: 'EXPENSE_UPDATED',
        data: {
          actorName: 'x',
          groupName: 'g',
          expenseName: 'e',
          change: { kind: 'removed', role: 'debtor', amount: 1 },
        },
      }),
    ).toEqual({ kind: 'group', groupId: 'g1' });
  });

  it('has no destination once the group is gone', () => {
    expect(
      notificationTarget({
        groupId: null,
        expenseId: null,
        paymentId: null,
        type: 'GROUP_ADDED',
        data: { actorName: 'x', groupName: 'g' },
      }),
    ).toBeNull();
  });
});
