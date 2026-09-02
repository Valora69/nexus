/**
 * Group CRUD service — mobile mirror of
 * `apps/web/lib/client/services/groupService.ts`.
 *
 * Every call goes through `apiFetch`, so the Bearer token and 401 flow
 * are inherited automatically. `GroupWithRelations` is used for list +
 * detail return types because the web API includes `members` and
 * `expenses` (summary) on both surfaces.
 */

import type { GroupWithRelations } from '@repo/shared/types/entities';
import type {
  CreateGroupData,
  UpdateGroupData,
} from '@repo/shared/types/request';

import { apiFetch } from '../client';

export function createGroup(data: CreateGroupData): Promise<GroupWithRelations> {
  return apiFetch<GroupWithRelations>('/api/group', {
    method: 'POST',
    json: data,
  });
}

export function getAllGroups(): Promise<GroupWithRelations[]> {
  return apiFetch<GroupWithRelations[]>('/api/group');
}

export function getGroupById(id: string): Promise<GroupWithRelations> {
  return apiFetch<GroupWithRelations>(`/api/group/${id}`);
}

export function updateGroup(
  id: string,
  data: UpdateGroupData,
): Promise<GroupWithRelations> {
  return apiFetch<GroupWithRelations>(`/api/group/${id}`, {
    method: 'PATCH',
    json: data,
  });
}

export function removeGroup(id: string): Promise<void> {
  return apiFetch<void>(`/api/group/${id}`, { method: 'DELETE' });
}
