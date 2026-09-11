import type { Prisma } from '@prisma/client';
import type {
  NotificationDataMap,
  NotificationType,
} from '@repo/shared/types/notifications';
import { prisma } from '@/lib/server/db';
import { mergeExpenseChanges } from '@/lib/server/notification-builders';

/**
 * Notification persistence primitives. Same contract as `logActivity`:
 * called after the business transaction commits, never inside it, and
 * never throws — a failed notification must not fail a payment.
 */

export type NotifyInput = {
  [T in NotificationType]: {
    type: T;
    recipientId: string;
    actorId: string | null;
    data: NotificationDataMap[T];
    groupId?: string | null;
    expenseId?: string | null;
    paymentId?: string | null;
    friendRequestId?: string | null;
    dedupeKey?: string | null;
  };
}[NotificationType];

function toRow(input: NotifyInput): Prisma.NotificationCreateManyInput {
  return {
    type: input.type,
    recipientId: input.recipientId,
    actorId: input.actorId,
    data: input.data as unknown as Prisma.InputJsonValue,
    groupId: input.groupId ?? null,
    expenseId: input.expenseId ?? null,
    paymentId: input.paymentId ?? null,
    friendRequestId: input.friendRequestId ?? null,
    dedupeKey: input.dedupeKey ?? null,
  };
}

/** Never notify someone about their own action. */
const notSelf = (i: NotifyInput) => i.recipientId !== i.actorId;

/** Run a non-critical notification step; log and swallow any failure. */
export async function safely<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Notification step failed (non-fatal): ${label}`, error);
    return undefined;
  }
}

/** Insert notifications in one statement. */
export async function notify(inputs: NotifyInput[]): Promise<void> {
  const rows = inputs.filter(notSelf);
  if (rows.length === 0) return;
  await safely('notify', () =>
    prisma.notification.createMany({ data: rows.map(toRow) }),
  );
}

type ExpenseUpdateInput = Extract<NotifyInput, { type: 'EXPENSE_UPDATED' }>;

/**
 * Expense edits coalesce: if the recipient still has an unread update for
 * the same expense, fold the new change into it (original "from", latest
 * "to") instead of stacking another row. A net-zero result deletes it.
 */
export async function notifyExpenseUpdates(
  inputs: ExpenseUpdateInput[],
): Promise<void> {
  const fresh: NotifyInput[] = [];

  await Promise.all(
    inputs.filter(notSelf).map((input) =>
      safely('coalesce expense update', async () => {
        const existing = input.dedupeKey
          ? await prisma.notification.findFirst({
              where: {
                recipientId: input.recipientId,
                dedupeKey: input.dedupeKey,
                readAt: null,
              },
              orderBy: { createdAt: 'desc' },
              select: { id: true, data: true },
            })
          : null;

        if (!existing) {
          fresh.push(input);
          return;
        }

        const prev = existing.data as unknown as
          NotificationDataMap['EXPENSE_UPDATED'] | null;
        const merged = prev?.change
          ? mergeExpenseChanges(prev.change, input.data.change)
          : input.data.change;

        if (!merged) {
          await prisma.notification.delete({ where: { id: existing.id } });
          return;
        }

        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            actorId: input.actorId,
            data: {
              ...input.data,
              change: merged,
            } as unknown as Prisma.InputJsonValue,
            createdAt: new Date(),
          },
        });
      }),
    ),
  );

  await notify(fresh);
}

/** Mark matching unread notifications read — "acting on it resolves it". */
export async function resolveNotifications(
  where: Prisma.NotificationWhereInput & { recipientId: string },
): Promise<void> {
  await safely('resolve', () =>
    prisma.notification.updateMany({
      where: { ...where, readAt: null },
      data: { readAt: new Date() },
    }),
  );
}

/** Delete notifications by id (used to retract never-seen, now-moot rows). */
export async function retractNotifications(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await safely('retract', () =>
    prisma.notification.deleteMany({ where: { id: { in: ids } } }),
  );
}
