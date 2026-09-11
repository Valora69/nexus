import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createGroup,
  updateGroup,
  removeGroup,
} from '../services/groupService';
import { CreateGroupData, UpdateGroupData } from '../../types/request';
import { invalidateGroupDomain } from '../invalidations';

export const useCreateGroup = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { groupData: CreateGroupData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { groupData: CreateGroupData }>({
    mutationFn: ({ groupData }) => createGroup(groupData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};

export const useUpdateGroup = (
  mutationOptions?: UseMutationOptions<
    unknown,
    Error,
    { id: string; groupData: UpdateGroupData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
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
};

export const useRemoveGroup = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => removeGroup(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};
