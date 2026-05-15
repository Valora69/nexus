'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllFriends,
  getPendingRequests,
  getSentRequests,
} from '../services/friendService';

// Time-sensitive social data — refetch eagerly so new requests / accepts show
// up without manual refresh. Mirrors the pattern used by expense-split queries.
const FRIEND_QUERY_OPTIONS = {
  staleTime: 30 * 1000,
  refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true,
};

export const useGetAllFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => getAllFriends(),
    ...FRIEND_QUERY_OPTIONS,
  });
};

export const useGetPendingRequests = () => {
  return useQuery({
    queryKey: ['friendRequests', 'pending'],
    queryFn: () => getPendingRequests(),
    ...FRIEND_QUERY_OPTIONS,
  });
};

export const useGetSentRequests = () => {
  return useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: () => getSentRequests(),
    ...FRIEND_QUERY_OPTIONS,
  });
};
