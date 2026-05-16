import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

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

  return useMutation({
    mutationFn: ({ groupData }) => createGroup(groupData),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
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

  return useMutation({
    mutationFn: ({ id, groupData }) => updateGroup(id, groupData),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveGroup = (
  mutationOptions?: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => removeGroup(id),
    onSuccess: (...args) => {
      invalidateGroupDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
