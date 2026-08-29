/**
 * Exemplar for the mobile service layer.
 *
 * Every service module in `lib/api/services/*` follows this shape:
 *   - one file per web service (mirrors `apps/web/lib/client/services/*`)
 *   - exports one named async function per endpoint
 *   - typed with the shared entity from `@repo/shared/types/entities`
 *   - calls `apiFetch` (Bearer injected by the auth context) — never
 *     `fetch` directly, so 401s hit the shared unauthorized handler
 *
 * Hooks in `lib/api/queries/*` and `lib/api/mutations/*` compose these
 * functions with TanStack Query.
 */

import type { User } from '@repo/shared/types/entities';

import { apiFetch } from '../client';

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/user/currentuser');
}

export function getUserById(id: string): Promise<User> {
  return apiFetch<User>(`/api/user/${id}`);
}
