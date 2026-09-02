/**
 * Group read hooks. Keys share the `queryKeys.groups` namespace with
 * web, so a create/edit on either surface invalidates both.
 *
 * `staleTime` is bumped to 5 minutes because the group list is
 * relatively stable — pull-to-refresh (added by the screens) is the
 * intended way to force a fresh fetch.
 */

import type { GroupWithRelations } from '@repo/shared/types/entities';
import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getAllGroups, getGroupById } from '../services/groupService';

export function useGetAllGroups() {
  return useQuery<GroupWithRelations[]>({
    queryKey: queryKeys.groups.all(),
    queryFn: getAllGroups,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetGroupById(id: string | undefined, enabled = true) {
  return useQuery<GroupWithRelations>({
    queryKey: queryKeys.groups.byId(id ?? ''),
    queryFn: () => getGroupById(id as string),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id,
  });
}
