'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllFriends,
  getPendingRequests,
  getSentRequests,
} from '../services/friendService';

export const useGetAllFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => getAllFriends(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useGetPendingRequests = () => {
  return useQuery({
    queryKey: ['friendRequests', 'pending'],
    queryFn: () => getPendingRequests(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useGetSentRequests = () => {
  return useQuery({
    queryKey: ['friendRequests', 'sent'],
    queryFn: () => getSentRequests(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};
