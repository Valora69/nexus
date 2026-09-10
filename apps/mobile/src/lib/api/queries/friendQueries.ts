/**
 * Friend read hooks. Time-sensitive social data — refetch on mount and
 * on window focus so a fresh accept / decline shows up without pull-to-
 * refresh.
 */

import type {
  Friend,
  FriendRequestWithRelations,
} from '@repo/shared/types/entities';
import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import {
  getAllFriends,
  getPendingRequests,
  getSentRequests,
} from '../services/friendService';

const FRIEND_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
  refetchOnMount: 'always' as const,
} as const;

export function useGetAllFriends() {
  return useQuery<Friend[]>({
    queryKey: queryKeys.friends.all(),
    queryFn: getAllFriends,
    ...FRIEND_QUERY_OPTIONS,
  });
}

export function useGetPendingRequests() {
  return useQuery<FriendRequestWithRelations[]>({
    queryKey: queryKeys.friends.pendingRequests(),
    queryFn: getPendingRequests,
    ...FRIEND_QUERY_OPTIONS,
  });
}

export function useGetSentRequests() {
  return useQuery<FriendRequestWithRelations[]>({
    queryKey: queryKeys.friends.sentRequests(),
    queryFn: getSentRequests,
    ...FRIEND_QUERY_OPTIONS,
  });
}
