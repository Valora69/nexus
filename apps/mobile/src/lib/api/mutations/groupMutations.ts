/**
 * Group create / update / delete mutations. Mirror the web mutation
 * layer 1:1 — same argument shape, same domain invalidation call —
 * so a screen written against one API works against the other.
 *
 * `onSuccess` from any caller-supplied `mutationOptions` runs AFTER
 * our invalidation so caller-side toasts / navigation happen with a
 * primed cache, matching web.
 */

import type { GroupWithRelations } from '@repo/shared/types/entities';
import type {
  CreateGroupData,
  UpdateGroupData,
} from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidateGroupDomain } from '../invalidations';
import {
  createGroup,
  removeGroup,
  updateGroup,
} from '../services/groupService';

export function useCreateGroup(
  mutationOptions?: UseMutationOptions<
    GroupWithRelations,
    Error,
    { groupData: CreateGroupData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    GroupWithRelations,
    Error,
    { groupData: CreateGroupData }
  >({
    mutationFn: ({ groupData }) => createGroup(groupData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useUpdateGroup(
  mutationOptions?: UseMutationOptions<
    GroupWithRelations,
    Error,
    { id: string; groupData: UpdateGroupData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    GroupWithRelations,
    Error,
    { id: string; groupData: UpdateGroupData }
  >({
    mutationFn: ({ id, groupData }) => updateGroup(id, groupData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemoveGroup(
  mutationOptions?: UseMutationOptions<void, Error, { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => removeGroup(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}
