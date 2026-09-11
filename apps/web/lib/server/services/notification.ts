import type { Prisma } from '@prisma/client';
import type {
  NotificationDataMap,
  NotificationItem,
  NotificationPage,
  NotificationTarget,
  NotificationType,
} from '@repo/shared/types/notifications';
import { notificationTarget } from '@repo/shared/utils/notifications';
import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';

/**
 * The recipient's inbox. Every query is scoped to `recipientId = userId`;
 * a notification id from the client is never trusted on its own.
 */

const DEFAULT_TAKE = 20;

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  data: true,
  groupId: true,
  expenseId: true,
  paymentId: true,
  friendRequestId: true,
  readAt: true,
  createdAt: true,
  actor: { select: { id: true, name: true, picture: true } },
} as const satisfies Prisma.NotificationSelect;

type Row = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_SELECT;
}>;

// Keyset cursor "<createdAt ISO>|<id>": stable under inserts, unlike offsets.
function encodeCursor(row: Pick<Row, 'createdAt' | 'id'>) {
  return `${row.createdAt.toISOString()}|${row.id}`;
}

function decodeCursor(cursor: string) {
  const [iso, id] = cursor.split('|');
  const createdAt = iso ? new Date(iso) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime()) || !id) {
    throw new ApiError(400, 'Invalid cursor');
  }
  return { createdAt, id };
}

/** Group-scoped destinations are dropped once the user leaves the group. */
function linkableTarget(
  row: Row,
  memberGroupIds: Set<string>,
): NotificationTarget | null {
  const target = notificationTarget({
    type: row.type as NotificationType,
    data: row.data as unknown as NotificationDataMap[NotificationType],
    groupId: row.groupId,
    expenseId: row.expenseId,
    paymentId: row.paymentId,
  });
  if (!target) return null;
  const groupScoped =
    target.kind === 'group' ||
    target.kind === 'expense' ||
    target.kind === 'verifyPayment';
  if (groupScoped && row.groupId && !memberGroupIds.has(row.groupId)) {
    return null;
  }
  return target;
}

function toItem(row: Row, memberGroupIds: Set<string>): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    // `data` is written by our own builders to match NotificationDataMap.
    data: row.data as unknown as NotificationDataMap[NotificationType],
    actor: row.actor,
    groupId: row.groupId,
    expenseId: row.expenseId,
    paymentId: row.paymentId,
    friendRequestId: row.friendRequestId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    target: linkableTarget(row, memberGroupIds),
  } as NotificationItem;
}

export async function listNotifications(
  userId: string,
  cursor?: string,
  take = DEFAULT_TAKE,
): Promise<NotificationPage> {
  const after = cursor ? decodeCursor(cursor) : null;

  const rows = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(after && {
        OR: [
          { createdAt: { lt: after.createdAt } },
          { createdAt: after.createdAt, id: { lt: after.id } },
        ],
      }),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    select: NOTIFICATION_SELECT,
  });

  const page = rows.slice(0, take);
  const last = page[page.length - 1];
  const nextCursor = rows.length > take && last ? encodeCursor(last) : null;

  // One membership query for the whole page (no N+1).
  const groupIds = [
    ...new Set(page.map((r) => r.groupId).filter((g): g is string => !!g)),
  ];
  const memberships =
    groupIds.length > 0
      ? await prisma.groupMember.findMany({
          where: { userId, groupId: { in: groupIds } },
          select: { groupId: true },
        })
      : [];
  const memberGroupIds = new Set(memberships.map((m) => m.groupId));

  return {
    items: page.map((row) => toItem(row, memberGroupIds)),
    nextCursor,
  };
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}

export async function markRead(id: string, userId: string): Promise<void> {
  const { count } = await prisma.notification.updateMany({
    where: { id, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (count > 0) return;

  // Nothing updated: either already read (fine) or not yours / missing.
  const owned = await prisma.notification.findFirst({
    where: { id, recipientId: userId },
    select: { id: true },
  });
  if (!owned) {
    throw new ApiError(404, 'Notification not found');
  }
}

export async function markAllRead(userId: string): Promise<number> {
  const { count } = await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return count;
}
