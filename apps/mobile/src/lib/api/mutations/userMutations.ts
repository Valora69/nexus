/**
 * User profile mutations — powers the Profile tab.
 *
 * `useUpdateUser` fans invalidations across every domain that
 * denormalizes name/gcashNumber (splits, expenses, groups, friends).
 * `useRemoveUser` handles the App Store 5.1.1(v) account-deletion flow;
 * the local sign-out is the caller's responsibility so the invalidation
 * has nothing to refetch against a signed-out session.
 */

import type { User } from '@repo/shared/types/entities';
import type { UpdateUserData } from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidateUserDomain } from '../invalidations';
import { removeUser, updateUser } from '../services/userService';

export function useUpdateUser(
  mutationOptions?: UseMutationOptions<
    User,
    Error,
    { id: string; userData: UpdateUserData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; userData: UpdateUserData }>({
    mutationFn: ({ id, userData }) => updateUser(id, userData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateUserDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemoveUser(
  mutationOptions?: UseMutationOptions<User, Error, { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string }>({
    mutationFn: ({ id }) => removeUser(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateUserDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}
