import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { NotificationPage } from '@repo/shared/types/notifications';

import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import { queryKeys } from '../queryKeys';
import { invalidateNotificationDomain } from '../invalidations';

type Inbox = InfiniteData<NotificationPage, string | undefined>;

/** Optimistically stamp `readAt` on matching rows in every cached page. */
function markCachedRead(
  inbox: Inbox | undefined,
  isMatch: (id: string) => boolean,
): Inbox | undefined {
  if (!inbox) return inbox;
  const now = new Date().toISOString();
  return {
    ...inbox,
    pages: inbox.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        !item.readAt && isMatch(item.id) ? { ...item, readAt: now } : item,
      ),
    })),
  };
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => markNotificationRead(id),
    onMutate: ({ id }) => {
      const wasUnread = queryClient
        .getQueryData<Inbox>(queryKeys.notifications.list())
        ?.pages.some((p) => p.items.some((i) => i.id === id && !i.readAt));
      queryClient.setQueryData<Inbox>(queryKeys.notifications.list(), (old) =>
        markCachedRead(old, (itemId) => itemId === id),
      );
      if (wasUnread) {
        queryClient.setQueryData<{ count: number }>(
          queryKeys.notifications.unreadCount(),
          (old) => (old ? { count: Math.max(0, old.count - 1) } : old),
        );
      }
    },
    onSettled: () => invalidateNotificationDomain(queryClient),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: () => {
      queryClient.setQueryData<Inbox>(queryKeys.notifications.list(), (old) =>
        markCachedRead(old, () => true),
      );
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), {
        count: 0,
      });
    },
    onSettled: () => invalidateNotificationDomain(queryClient),
  });
};
