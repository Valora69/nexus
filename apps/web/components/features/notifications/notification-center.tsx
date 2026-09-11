'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BellOff, CheckCheck, Loader2 } from 'lucide-react';
import type { NotificationItem as NotificationItemData } from '@repo/shared/types/notifications';

import { Button } from '@web/components/ui/button';
import { Skeleton } from '@web/components/ui/skeleton';
import { useNotifications } from '@web/lib/client/queries/notificationQueries';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@web/lib/client/mutations/notificationMutations';
import { NotificationItem, notificationHref } from './notification-item';

type Section = { label: string; items: NotificationItemData[] };

/** Today / Yesterday / Earlier, by the viewer's local calendar day. */
function groupByDay(items: NotificationItemData[]): Section[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const sections: Section[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ];
  for (const item of items) {
    const at = new Date(item.createdAt);
    const index = at >= startOfToday ? 0 : at >= startOfYesterday ? 1 : 2;
    sections[index]?.items.push(item);
  }
  return sections.filter((s) => s.items.length > 0);
}

interface NotificationCenterProps {
  open: boolean;
  unreadCount: number;
  /** Called after navigating, so the container can close. */
  onNavigate: () => void;
}

export function NotificationCenter({
  open,
  unreadCount,
  onNavigate,
}: NotificationCenterProps) {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications(open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const sections = useMemo(
    () => groupByDay(data?.pages.flatMap((p) => p.items) ?? []),
    [data],
  );

  const handleSelect = (notification: NotificationItemData) => {
    if (!notification.readAt) markRead.mutate({ id: notification.id });
    if (!notification.target) return;
    onNavigate();
    router.push(notificationHref(notification.target));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all as read
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError && !data ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-muted">
              Couldn&apos;t load notifications.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-muted">
              <BellOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted">
              Payments, expenses and friend requests that need you show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <section key={section.label}>
                <h3 className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
            {hasNextPage ? (
              <div className="flex justify-center pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Show earlier'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
