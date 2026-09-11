import type {
  NotificationDataMap,
  NotificationTarget,
  NotificationType,
} from '../types/notifications';
import { formatCurrency } from './formatters';

export interface FormattedNotification {
  /** Leading name, rendered emphasized ("James"). */
  actor: string;
  /** Rest of the sentence ("paid you for Dinner"). */
  text: string;
  /** Secondary line ("GCash · CS3A"). */
  context?: string;
  /** Right-aligned amount; `in` = money coming to you. */
  amount?: { value: number; direction: 'in' | 'out' | 'neutral' };
}

/** `type` and `data` stay correlated, so the switch below narrows `data`. */
type Formattable = {
  [T in NotificationType]: { type: T; data: NotificationDataMap[T] };
}[NotificationType] & { actor?: { name: string } | null };

const peso = (n: number) => formatCurrency(n);

/**
 * Render a notification from its type + snapshot. Written from the
 * recipient's point of view; the actor is never the recipient.
 */
export function formatNotification(n: Formattable): FormattedNotification {
  const actor = n.actor?.name || n.data.actorName || 'Someone';

  switch (n.type) {
    case 'GROUP_ADDED':
      return { actor, text: `added you to ${n.data.groupName}` };

    case 'EXPENSE_ADDED': {
      const d = n.data;
      if (d.count && d.count > 1) {
        return {
          actor,
          text: `added ${d.count} expenses you're in`,
          context: d.groupName,
          amount: {
            value: d.amount,
            direction: d.role === 'payee' ? 'in' : 'out',
          },
        };
      }
      const whom = d.payeeIsActor ? 'them' : d.payeeName;
      return {
        actor,
        text:
          d.role === 'payee'
            ? `logged ${d.expenseName} — you're owed`
            : `added ${d.expenseName} — you owe ${whom}`,
        context: d.groupName,
        amount: {
          value: d.amount,
          direction: d.role === 'payee' ? 'in' : 'out',
        },
      };
    }

    case 'EXPENSE_UPDATED': {
      const d = n.data;
      const c = d.change;
      const context = `${d.expenseName} · ${d.groupName}`;
      switch (c.kind) {
        case 'share_changed':
          return {
            actor,
            text:
              c.role === 'payee'
                ? `changed what you're owed: ${peso(c.from)} → ${peso(c.to)}`
                : `changed your share: ${peso(c.from)} → ${peso(c.to)}`,
            context,
          };
        case 'added':
          return {
            actor,
            text:
              c.role === 'payee'
                ? `set you as the one who paid for ${d.expenseName}`
                : `added you to ${d.expenseName}`,
            context: d.groupName,
            amount: {
              value: c.amount,
              direction: c.role === 'payee' ? 'in' : 'out',
            },
          };
        case 'removed':
          return {
            actor,
            text: `removed you from ${d.expenseName}`,
            context: d.groupName,
          };
        case 'payee_changed':
          return {
            actor,
            text: `changed who you owe to ${c.payeeName}`,
            context,
            amount: { value: c.amount, direction: 'out' },
          };
      }
      break;
    }

    case 'EXPENSE_DELETED': {
      const d = n.data;
      return {
        actor,
        text:
          d.role === 'payee'
            ? `deleted ${d.expenseName} — ${peso(d.amount)} no longer owed to you`
            : `deleted ${d.expenseName} — you no longer owe ${peso(d.amount)}`,
        context: d.groupName,
      };
    }

    case 'PAYMENT_RECORDED': {
      const d = n.data;
      const partial = d.remainingAfter > 0.01 && d.shareAmount > d.amount;
      return {
        actor,
        text: partial
          ? `paid you ${peso(d.amount)} of ${peso(d.shareAmount)} for ${d.expenseName} — confirm receipt`
          : `paid you for ${d.expenseName} — confirm receipt`,
        context: `${d.method === 'GCASH' ? 'GCash' : 'Cash'} · ${d.groupName}`,
        amount: { value: d.amount, direction: 'in' },
      };
    }

    case 'PAYMENT_CONFIRMED': {
      const d = n.data;
      return {
        actor,
        text: d.splitSettled
          ? `confirmed your payment — you're all settled for ${d.expenseName}`
          : `confirmed your payment for ${d.expenseName} — ${peso(d.remaining)} left`,
        context: d.groupName,
        amount: { value: d.amount, direction: 'neutral' },
      };
    }

    case 'PAYMENT_WITHDRAWN': {
      const d = n.data;
      return {
        actor,
        text: `withdrew a ${peso(d.amount)} payment for ${d.expenseName}`,
        context: d.groupName,
      };
    }

    case 'FRIEND_REQUEST':
      return { actor, text: 'sent you a friend request' };

    case 'FRIEND_ACCEPTED':
      return { actor, text: 'accepted your friend request' };
  }

  return { actor, text: '' };
}

type Targetable = {
  type: NotificationType;
  data: NotificationDataMap[NotificationType];
  groupId: string | null;
  expenseId: string | null;
  paymentId: string | null;
};

/**
 * Semantic destination for a notification. Each app maps it to its own
 * routes. Returns null when the entity it points at no longer exists.
 */
export function notificationTarget(n: Targetable): NotificationTarget | null {
  const group = n.groupId
    ? ({ kind: 'group', groupId: n.groupId } as const)
    : null;
  const expense =
    n.groupId && n.expenseId
      ? ({
          kind: 'expense',
          groupId: n.groupId,
          expenseId: n.expenseId,
        } as const)
      : null;

  switch (n.type) {
    case 'GROUP_ADDED':
    case 'EXPENSE_DELETED':
      return group;
    case 'EXPENSE_ADDED': {
      const d = n.data as NotificationDataMap['EXPENSE_ADDED'];
      return d.count && d.count > 1 ? group : (expense ?? group);
    }
    case 'EXPENSE_UPDATED': {
      const d = n.data as NotificationDataMap['EXPENSE_UPDATED'];
      return d.change.kind === 'removed' ? group : (expense ?? group);
    }
    case 'PAYMENT_RECORDED':
      return n.paymentId
        ? { kind: 'verifyPayment', paymentId: n.paymentId }
        : (expense ?? group);
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_WITHDRAWN':
      return expense ?? group;
    case 'FRIEND_REQUEST':
      return { kind: 'friendRequests' };
    case 'FRIEND_ACCEPTED':
      return { kind: 'friends' };
  }
  return null;
}
