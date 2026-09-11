'use client';

import type {
  NotificationItem as NotificationItemData,
  NotificationTarget,
} from '@repo/shared/types/notifications';
import { formatNotification } from '@repo/shared/utils/notifications';

import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Dot } from '@web/components/ui/badge';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  getInitials,
} from '@web/lib/utils';

/** Web routes for a semantic notification target. */
export function notificationHref(target: NotificationTarget): string {
  switch (target.kind) {
    case 'group':
      return `/groups/${target.groupId}`;
    case 'expense':
      return `/groups/${target.groupId}?expense=${target.expenseId}`;
    case 'verifyPayment':
      return `/payments?verify=${target.paymentId}`;
    case 'friendRequests':
      return '/friends?tab=requests';
    case 'friends':
      return '/friends';
  }
}

interface NotificationItemProps {
  notification: NotificationItemData;
  onSelect: (notification: NotificationItemData) => void;
}

export function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const { actor, text, context, amount } = formatNotification(notification);
  const unread = !notification.readAt;
  const unavailable = !notification.target;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        unread ? 'bg-card' : 'bg-transparent',
        unavailable ? 'cursor-default' : 'hover:bg-card-hover',
      )}
    >
      <Avatar className="mt-0.5 h-9 w-9 shrink-0">
        {notification.actor?.picture ? (
          <AvatarImage src={notification.actor.picture} alt="" />
        ) : null}
        <AvatarFallback className="bg-card text-xs">
          {getInitials(actor)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            unread ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          <span className="font-medium">{actor}</span> {text}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {[
            context,
            unavailable && notification.type !== 'FRIEND_REQUEST'
              ? 'No longer available'
              : null,
            formatRelativeTime(notification.createdAt),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        {amount ? (
          <span
            className={cn(
              'font-mono text-sm',
              amount.direction === 'in' ? 'text-gain' : 'text-foreground',
            )}
          >
            {amount.direction === 'in' ? '+' : ''}
            {formatCurrency(amount.value)}
          </span>
        ) : null}
        {unread ? <Dot className="mt-1" /> : null}
      </div>
    </button>
  );
}
