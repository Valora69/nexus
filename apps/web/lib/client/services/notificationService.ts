import { API_BASES } from '../config';
import { responseError } from './errors';
import type {
  NotificationPage,
  UnreadNotificationCount,
} from '@repo/shared/types/notifications';

const BASE = `${API_BASES.notification}/notifications`;

const JSON_INIT = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
} as const;

export const getNotifications = async (
  cursor?: string,
): Promise<NotificationPage> => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  const res = await fetch(`${BASE}${query ? `?${query}` : ''}`, JSON_INIT);
  if (!res.ok) throw await responseError(res, 'Failed to load notifications');
  return res.json();
};

export const getUnreadNotificationCount =
  async (): Promise<UnreadNotificationCount> => {
    const res = await fetch(`${BASE}/unread-count`, JSON_INIT);
    if (!res.ok) {
      throw await responseError(res, 'Failed to load notification count');
    }
    return res.json();
  };

export const markNotificationRead = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}/read`, {
    ...JSON_INIT,
    method: 'POST',
  });
  if (!res.ok) throw await responseError(res, 'Failed to mark as read');
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const res = await fetch(`${BASE}/read-all`, { ...JSON_INIT, method: 'POST' });
  if (!res.ok) throw await responseError(res, 'Failed to mark all as read');
};
