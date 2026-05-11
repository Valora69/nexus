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
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] });
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
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] });
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
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
