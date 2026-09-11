'use client';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getNotifications,
  getUnreadNotificationCount,
} from '../services/notificationService';
import { queryKeys } from '../queryKeys';
import { LIVE_REFETCH } from '../live';

/** Badge count: polled like the other live money views (15s, paused when hidden). */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    ...LIVE_REFETCH,
    queryFn: () => getUnreadNotificationCount(),
    select: (data) => data.count,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });
};

/** Inbox pages; only fetched while the notification center is open. */
export const useNotifications = (enabled: boolean) => {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 10 * 1000,
    refetchOnMount: 'always',
  });
};
