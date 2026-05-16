import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

import {
  createGroupMember,
  updateGroupMember,
  removeGroupMember,
} from '../services/groupMemberService';
import {
  CreateGroupMemberData,
  UpdateGroupMemberData,
} from '../../types/request';
import { invalidateGroupDomain } from '../invalidations';

export const useCreateGroupMember = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { groupMemberData: CreateGroupMemberData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupMemberData }) => createGroupMember(groupMemberData),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useUpdateGroupMember = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { id: string; groupMemberData: UpdateGroupMemberData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupMemberData }) =>
      updateGroupMember(id, groupMemberData),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveGroupMember = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => removeGroupMember(id),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
