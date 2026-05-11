import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
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

export const useSendFriendRequest = (
  mutationOptions: UseMutationOptions<
    { message: string },
    Error,
    { data: SendFriendRequestData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }) => sendFriendRequest(data),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
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

  return useMutation({
    mutationFn: ({ requestId }) => acceptFriendRequest(requestId),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
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

  return useMutation({
    mutationFn: ({ data }) => acceptFriendRequestByToken(data),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
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

  return useMutation({
    mutationFn: ({ requestId }) => declineFriendRequest(requestId),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
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

  return useMutation({
    mutationFn: ({ friendId }) => removeFriend(friendId),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
