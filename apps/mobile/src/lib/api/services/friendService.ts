/**
 * Friend service — mobile mirror of `apps/web/lib/client/services/friendService.ts`.
 *
 * Covers the full request lifecycle used by the Friends tab: list friends,
 * incoming/sent requests, invite-by-email (server sends the Resend email),
 * accept/decline, remove. The accept-by-token path is exposed too so the
 * deep-link flow in stage 13 can reuse the same choke point.
 */

import type {
  Friend,
  FriendRequestWithRelations,
} from '@repo/shared/types/entities';
import type {
  AcceptFriendRequestByTokenData,
  SendFriendRequestData,
} from '@repo/shared/types/request';

import { apiFetch } from '../client';

export function getAllFriends(): Promise<Friend[]> {
  return apiFetch<Friend[]>('/api/friend');
}

export function getPendingRequests(): Promise<FriendRequestWithRelations[]> {
  return apiFetch<FriendRequestWithRelations[]>('/api/friend/requests');
}

export function getSentRequests(): Promise<FriendRequestWithRelations[]> {
  return apiFetch<FriendRequestWithRelations[]>('/api/friend/requests/sent');
}

export function sendFriendRequest(
  data: SendFriendRequestData,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/friend/request', {
    method: 'POST',
    json: data,
  });
}

export function acceptFriendRequest(
  requestId: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/friend/requests/${requestId}/accept`,
    { method: 'POST' },
  );
}

export function declineFriendRequest(
  requestId: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/friend/requests/${requestId}/decline`,
    { method: 'POST' },
  );
}

export function acceptFriendRequestByToken(
  data: AcceptFriendRequestByTokenData,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/friend/requests/accept-by-token', {
    method: 'POST',
    json: data,
  });
}

export function removeFriend(
  friendId: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/friend/${friendId}`, {
    method: 'DELETE',
  });
}
