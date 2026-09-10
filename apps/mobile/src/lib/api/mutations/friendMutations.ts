/**
 * Friend mutations — mobile mirror of `apps/web/lib/client/mutations/friendMutations.ts`.
 *
 * Every mutation calls `invalidateFriendDomain` so friends list + inbox +
 * sent list stay in sync after any change (the pending-requests card
 * disappears on accept without a manual refetch).
 */

import type {
  AcceptFriendRequestByTokenData,
  SendFriendRequestData,
} from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidateFriendDomain } from '../invalidations';
import {
  acceptFriendRequest,
  acceptFriendRequestByToken,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../services/friendService';

type MessageResult = { message: string };

export function useSendFriendRequest(
  mutationOptions?: UseMutationOptions<
    MessageResult,
    Error,
    { data: SendFriendRequestData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResult, Error, { data: SendFriendRequestData }>({
    mutationFn: ({ data }) => sendFriendRequest(data),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useAcceptFriendRequest(
  mutationOptions?: UseMutationOptions<
    MessageResult,
    Error,
    { requestId: string }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResult, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => acceptFriendRequest(requestId),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useDeclineFriendRequest(
  mutationOptions?: UseMutationOptions<
    MessageResult,
    Error,
    { requestId: string }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResult, Error, { requestId: string }>({
    mutationFn: ({ requestId }) => declineFriendRequest(requestId),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useAcceptFriendRequestByToken(
  mutationOptions?: UseMutationOptions<
    MessageResult,
    Error,
    { data: AcceptFriendRequestByTokenData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    MessageResult,
    Error,
    { data: AcceptFriendRequestByTokenData }
  >({
    mutationFn: ({ data }) => acceptFriendRequestByToken(data),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemoveFriend(
  mutationOptions?: UseMutationOptions<
    MessageResult,
    Error,
    { friendId: string }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<MessageResult, Error, { friendId: string }>({
    mutationFn: ({ friendId }) => removeFriend(friendId),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidateFriendDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}
