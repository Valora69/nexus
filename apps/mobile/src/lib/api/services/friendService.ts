/**
 * Friend read service — only the "list my friends" endpoint is needed
 * this stage (member picker on the group detail screen sources users
 * from friends). The full friend-request surface lands in a later stage
 * dedicated to the Friends tab.
 */

import type { Friend } from '@repo/shared/types/entities';

import { apiFetch } from '../client';

export function getAllFriends(): Promise<Friend[]> {
  return apiFetch<Friend[]>('/api/friend');
}
