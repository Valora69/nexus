/**
 * User service — reads current/user-by-id, plus the two profile-mutating
 * endpoints the Profile tab needs: PATCH for gcashNumber/name edits and
 * DELETE for the App Store Guideline 5.1.1(v) account-deletion flow.
 *
 * Every service module in `lib/api/services/*` follows this shape:
 *   - one file per web service (mirrors `apps/web/lib/client/services/*`)
 *   - exports one named async function per endpoint
 *   - typed with the shared entity from `@repo/shared/types/entities`
 *   - calls `apiFetch` (Bearer injected by the auth context) — never
 *     `fetch` directly, so 401s hit the shared unauthorized handler
 */

import type { User } from '@repo/shared/types/entities';
import type { UpdateUserData } from '@repo/shared/types/request';

import { apiFetch } from '../client';

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/user/currentuser');
}

export function getUserById(id: string): Promise<User> {
  return apiFetch<User>(`/api/user/${id}`);
}

export function updateUser(id: string, data: UpdateUserData): Promise<User> {
  return apiFetch<User>(`/api/user/${id}`, {
    method: 'PATCH',
    json: data,
  });
}

export function removeUser(id: string): Promise<User> {
  return apiFetch<User>(`/api/user/${id}`, { method: 'DELETE' });
}
