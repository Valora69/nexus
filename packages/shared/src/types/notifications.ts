/**
 * In-app notification contract shared by the server (writes `data`),
 * web and mobile (render it). Mirrors the Prisma `NotificationType` enum and
 * the `Notification.data` JSON column.
 *
 * `data` is an event-time snapshot: names and amounts as they were when the
 * action happened. That is deliberate — "your share changed ₱400 → ₱500" is
 * a historical fact, and it must still render after the expense is deleted.
 */

export const NOTIFICATION_TYPES = [
  'GROUP_ADDED',
  'EXPENSE_ADDED',
  'EXPENSE_UPDATED',
  'EXPENSE_DELETED',
  'PAYMENT_RECORDED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_WITHDRAWN',
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Your side of an expense: you owe (`debtor`) or you're owed (`payee`). */
export type ExpenseRole = 'debtor' | 'payee';

/** How an expense edit changed *your* stake. One per recipient per edit. */
export type ExpenseUpdateChange =
  | { kind: 'added'; role: ExpenseRole; amount: number }
  | { kind: 'removed'; role: ExpenseRole; amount: number }
  | { kind: 'share_changed'; role: ExpenseRole; from: number; to: number }
  | { kind: 'payee_changed'; payeeName: string; amount: number };

interface ActorSnapshot {
  /** Fallback when the actor account no longer exists. */
  actorName: string;
}

interface ExpenseSnapshot extends ActorSnapshot {
  groupName: string;
  expenseName: string;
}

export interface NotificationDataMap {
  GROUP_ADDED: ActorSnapshot & { groupName: string };
  EXPENSE_ADDED: ExpenseSnapshot & {
    role: ExpenseRole;
    /** Your share (debtor) or the total owed to you (payee). */
    amount: number;
    payeeName: string;
    payeeIsActor: boolean;
    /** Set when one bulk create added several expenses for you. */
    count?: number;
  };
  EXPENSE_UPDATED: ExpenseSnapshot & { change: ExpenseUpdateChange };
  EXPENSE_DELETED: ExpenseSnapshot & { role: ExpenseRole; amount: number };
  PAYMENT_RECORDED: ExpenseSnapshot & {
    amount: number;
    method: 'GCASH' | 'CASH';
    /** The payer's full share of the expense. */
    shareAmount: number;
    /** What's still unclaimed on that share after this payment. */
    remainingAfter: number;
  };
  PAYMENT_CONFIRMED: ExpenseSnapshot & {
    amount: number;
    /** Verified total now covers the whole share. */
    splitSettled: boolean;
    /** Unverified-or-unpaid remainder of the share. */
    remaining: number;
  };
  PAYMENT_WITHDRAWN: ExpenseSnapshot & { amount: number };
  FRIEND_REQUEST: ActorSnapshot;
  FRIEND_ACCEPTED: ActorSnapshot;
}

export type NotificationData<T extends NotificationType = NotificationType> =
  NotificationDataMap[T];

/** Where tapping a notification goes, independent of any app's routes. */
export type NotificationTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'expense'; groupId: string; expenseId: string }
  | { kind: 'verifyPayment'; paymentId: string }
  | { kind: 'friendRequests' }
  | { kind: 'friends' };

interface NotificationItemBase {
  id: string;
  actor: { id: string; name: string; picture: string | null } | null;
  groupId: string | null;
  expenseId: string | null;
  paymentId: string | null;
  friendRequestId: string | null;
  readAt: string | null;
  createdAt: string;
  /** Server-resolved; null when the destination is gone or no longer yours. */
  target: NotificationTarget | null;
}

/** One row of GET /api/notifications, discriminated by `type`. */
export type NotificationItem = {
  [T in NotificationType]: NotificationItemBase & {
    type: T;
    data: NotificationDataMap[T];
  };
}[NotificationType];

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface UnreadNotificationCount {
  count: number;
}
