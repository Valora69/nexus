import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

import { createUser, removeUser, updateUser } from '../services/userService';
import { CreateUserData, UpdateUserData } from '../../types/request';
import { invalidateUserDomain } from '../invalidations';
import { queryKeys } from '../queryKeys';

export const useCreateUser = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { userData: CreateUserData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { userData: CreateUserData }>({
    mutationFn: ({ userData }) => createUser(userData),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all() });
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

  return useMutation<
    unknown,
    Error,
    { id: string; userData: UpdateUserData }
  >({
    mutationFn: ({ id, userData }) => updateUser(id, userData),
    onSuccess: (...args) => {
      // Name and gcashNumber are denormalized across many payloads.
      invalidateUserDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveUser = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => removeUser(id),
    onSuccess: (...args) => {
      invalidateUserDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
