import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

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

  return useMutation<
    unknown,
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
};

export const useUpdateGroupMember = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { id: string; groupMemberData: UpdateGroupMemberData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { id: string; groupMemberData: UpdateGroupMemberData }
  >({
    mutationFn: ({ id, groupMemberData }) =>
      updateGroupMember(id, groupMemberData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};

export const useRemoveGroupMember = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => removeGroupMember(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};
