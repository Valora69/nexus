'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllFriends,
  getPendingRequests,
  getSentRequests,
} from '../services/friendService';
import { queryKeys } from '../queryKeys';

// Time-sensitive social data — refetch eagerly so new requests / accepts show
// up without manual refresh.
const FRIEND_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
};

export const useGetAllFriends = () => {
  return useQuery({
    queryKey: queryKeys.friends.all(),
    queryFn: () => getAllFriends(),
    ...FRIEND_QUERY_OPTIONS,
  });
};

export const useGetPendingRequests = () => {
  return useQuery({
    queryKey: queryKeys.friends.pendingRequests(),
    queryFn: () => getPendingRequests(),
    ...FRIEND_QUERY_OPTIONS,
  });
};

export const useGetSentRequests = () => {
  return useQuery({
    queryKey: queryKeys.friends.sentRequests(),
    queryFn: () => getSentRequests(),
    ...FRIEND_QUERY_OPTIONS,
  });
};
