import type {
  ExpenseRole,
  ExpenseUpdateChange,
} from '@repo/shared/types/notifications';
import type { NotifyInput } from '@/lib/server/notifications';

/**
 * Pure notification decisions: who is told what, for each business event.
 * No I/O here, so the rules are unit-testable in isolation.
 */

const CENT = 0.009;

export interface Stake {
  role: ExpenseRole;
  amount: number;
}

export interface ExpenseSnapshotInput {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  payeeId: string | null;
  payeeName: string;
  splits: Array<{ userId: string; amount: number }>;
}

export interface Actor {
  id: string;
  name: string;
}

/**
 * Who has money riding on an expense. Debtors are split owners other than
 * the payee; the payee's stake is the total owed to them. The payee's own
 * split is never a debt, and zero shares are ignored.
 */
export function expenseStakes(e: {
  payeeId: string | null;
  splits: Array<{ userId: string; amount: number }>;
}): Map<string, Stake> {
  const stakes = new Map<string, Stake>();
  if (!e.payeeId) return stakes;

  let owedToPayee = 0;
  for (const split of e.splits) {
    if (split.userId === e.payeeId || split.amount <= CENT) continue;
    stakes.set(split.userId, { role: 'debtor', amount: split.amount });
    owedToPayee += split.amount;
  }
  if (owedToPayee > CENT) {
    stakes.set(e.payeeId, { role: 'payee', amount: owedToPayee });
  }
  return stakes;
}

/** Most important change first: removed > added > share > payee. */
export function diffStake(
  before: Stake | null,
  after: Stake | null,
  payeeChange?: { name: string } | null,
): ExpenseUpdateChange | null {
  if (!before && !after) return null;
  if (before && !after) {
    return { kind: 'removed', role: before.role, amount: before.amount };
  }
  if (!before && after) {
    return { kind: 'added', role: after.role, amount: after.amount };
  }
  const b = before as Stake;
  const a = after as Stake;
  // A role flip (e.g. you become the payer) reads as a new stake.
  if (b.role !== a.role) {
    return { kind: 'added', role: a.role, amount: a.amount };
  }
  if (Math.abs(b.amount - a.amount) > CENT) {
    return {
      kind: 'share_changed',
      role: a.role,
      from: b.amount,
      to: a.amount,
    };
  }
  if (a.role === 'debtor' && payeeChange) {
    return {
      kind: 'payee_changed',
      payeeName: payeeChange.name,
      amount: a.amount,
    };
  }
  return null;
}

function stakeBefore(c: ExpenseUpdateChange): Stake | null {
  switch (c.kind) {
    case 'added':
      return null;
    case 'removed':
      return { role: c.role, amount: c.amount };
    case 'share_changed':
      return { role: c.role, amount: c.from };
    case 'payee_changed':
      return { role: 'debtor', amount: c.amount };
  }
}

function stakeAfter(c: ExpenseUpdateChange): Stake | null {
  switch (c.kind) {
    case 'added':
      return { role: c.role, amount: c.amount };
    case 'removed':
      return null;
    case 'share_changed':
      return { role: c.role, amount: c.to };
    case 'payee_changed':
      return { role: 'debtor', amount: c.amount };
  }
}

/**
 * Fold a newer edit into an unread one: keep the original "before", take
 * the latest "after". Returns null when the edits cancel out.
 */
export function mergeExpenseChanges(
  prev: ExpenseUpdateChange,
  next: ExpenseUpdateChange,
): ExpenseUpdateChange | null {
  const payeeName =
    next.kind === 'payee_changed'
      ? next.payeeName
      : prev.kind === 'payee_changed'
        ? prev.payeeName
        : null;
  return diffStake(
    stakeBefore(prev),
    stakeAfter(next),
    payeeName ? { name: payeeName } : null,
  );
}

export const expenseUpdateKey = (expenseId: string) =>
  `expense-updated:${expenseId}`;

export function expenseCreatedInputs(
  expense: ExpenseSnapshotInput,
  actor: Actor,
): NotifyInput[] {
  const inputs: NotifyInput[] = [];
  for (const [recipientId, stake] of expenseStakes(expense)) {
    inputs.push({
      type: 'EXPENSE_ADDED',
      recipientId,
      actorId: actor.id,
      groupId: expense.groupId,
      expenseId: expense.id,
      data: {
        actorName: actor.name,
        groupName: expense.groupName,
        expenseName: expense.name,
        role: stake.role,
        amount: stake.amount,
        payeeName: expense.payeeName,
        payeeIsActor: expense.payeeId === actor.id,
      },
    });
  }
  return inputs;
}

/**
 * Bulk create: one notification per recipient per group. A single expense
 * keeps its normal form; several collapse into "added N expenses".
 */
export function expensesCreatedInputs(
  expenses: ExpenseSnapshotInput[],
  actor: Actor,
): NotifyInput[] {
  const byRecipientGroup = new Map<string, NotifyInput[]>();
  for (const expense of expenses) {
    for (const input of expenseCreatedInputs(expense, actor)) {
      const key = `${input.recipientId}:${expense.groupId}`;
      byRecipientGroup.set(key, [...(byRecipientGroup.get(key) ?? []), input]);
    }
  }

  const out: NotifyInput[] = [];
  for (const group of byRecipientGroup.values()) {
    const first = group[0];
    if (!first || first.type !== 'EXPENSE_ADDED') continue;
    if (group.length === 1) {
      out.push(first);
      continue;
    }
    // Net position across the batch: owed to you minus what you owe.
    let net = 0;
    for (const i of group) {
      if (i.type !== 'EXPENSE_ADDED') continue;
      net += i.data.role === 'payee' ? i.data.amount : -i.data.amount;
    }
    out.push({
      ...first,
      expenseId: null,
      data: {
        ...first.data,
        role: net >= 0 ? 'payee' : 'debtor',
        amount: Math.abs(net),
        count: group.length,
      },
    });
  }
  return out;
}

export function expenseUpdatedInputs(
  before: { payeeId: string | null; splits: ExpenseSnapshotInput['splits'] },
  after: ExpenseSnapshotInput,
  actor: Actor,
): Extract<NotifyInput, { type: 'EXPENSE_UPDATED' }>[] {
  const b = expenseStakes(before);
  const a = expenseStakes(after);
  const payeeChanged = before.payeeId !== after.payeeId;
  const recipients = new Set([...b.keys(), ...a.keys()]);

  const inputs: Extract<NotifyInput, { type: 'EXPENSE_UPDATED' }>[] = [];
  for (const recipientId of recipients) {
    const change = diffStake(
      b.get(recipientId) ?? null,
      a.get(recipientId) ?? null,
      payeeChanged ? { name: after.payeeName } : null,
    );
    if (!change) continue;
    inputs.push({
      type: 'EXPENSE_UPDATED',
      recipientId,
      actorId: actor.id,
      groupId: after.groupId,
      expenseId: after.id,
      dedupeKey: expenseUpdateKey(after.id),
      data: {
        actorName: actor.name,
        groupName: after.groupName,
        expenseName: after.name,
        change,
      },
    });
  }
  return inputs;
}

export function expenseDeletedInputs(
  expense: ExpenseSnapshotInput,
  actor: Actor,
): NotifyInput[] {
  const inputs: NotifyInput[] = [];
  for (const [recipientId, stake] of expenseStakes(expense)) {
    inputs.push({
      type: 'EXPENSE_DELETED',
      recipientId,
      actorId: actor.id,
      // The expense is gone; link to its group.
      groupId: expense.groupId,
      data: {
        actorName: actor.name,
        groupName: expense.groupName,
        expenseName: expense.name,
        role: stake.role,
        amount: stake.amount,
      },
    });
  }
  return inputs;
}
