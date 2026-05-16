import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

import {
  sendFriendRequest,
  acceptFriendRequest,
  acceptFriendRequestByToken,
  declineFriendRequest,
  removeFriend,
} from '../services/friendService';
import type {
  SendFriendRequestData,
  AcceptFriendRequestByTokenData,
} from '../../types/request';
import { invalidateFriendDomain } from '../invalidations';

export const useSendFriendRequest = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { data: SendFriendRequestData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { data: SendFriendRequestData }
  >({
    mutationFn: ({ data }) => sendFriendRequest(data),
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useAcceptFriendRequest = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { requestId: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => acceptFriendRequest(requestId),
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useAcceptFriendRequestByToken = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { data: AcceptFriendRequestByTokenData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string },
    Error,
    { data: AcceptFriendRequestByTokenData }
  >({
    mutationFn: ({ data }) => acceptFriendRequestByToken(data),
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useDeclineFriendRequest = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { requestId: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => declineFriendRequest(requestId),
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemoveFriend = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { friendId: string }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, { friendId: string }>({
    mutationFn: ({ friendId }) => removeFriend(friendId),
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
