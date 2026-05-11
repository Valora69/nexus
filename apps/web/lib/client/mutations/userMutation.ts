import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import { createUser, removeUser, updateUser } from '../services/userService';
import { CreateUserData, UpdateUserData } from '../../types/request';

export const useCreateUser = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { userData: CreateUserData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userData }) => createUser(userData),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useUpdateUser = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; userData: UpdateUserData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userData }) => updateUser(id, userData),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['currentUsers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveUser = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => removeUser(id),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
