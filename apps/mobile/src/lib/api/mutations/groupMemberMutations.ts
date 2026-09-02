/**
 * Group-member add / remove mutations.
 *
 * The remove path throws a typed `RemoveMemberConflictError` on 409
 * (see `groupMemberService.ts`). Screens key their inline "cannot
 * remove" state off `error instanceof RemoveMemberConflictError` and
 * render the returned `blockers` list.
 */

import type { GroupMember } from '@repo/shared/types/entities';
import type { CreateGroupMemberData } from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidateGroupDomain } from '../invalidations';
import {
  createGroupMember,
  removeGroupMember,
} from '../services/groupMemberService';

export function useCreateGroupMember(
  mutationOptions?: UseMutationOptions<
    GroupMember,
    Error,
    { groupMemberData: CreateGroupMemberData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    GroupMember,
    Error,
    { groupMemberData: CreateGroupMemberData }
  >({
    mutationFn: ({ groupMemberData }) => createGroupMember(groupMemberData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemoveGroupMember(
  mutationOptions?: UseMutationOptions<void, Error, { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => removeGroupMember(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}
