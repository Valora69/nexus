'use client';
import { useQuery } from '@tanstack/react-query';

import { getAllGroups, getGroupById } from '../services/groupService';

export const useGetAllGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => getAllGroups(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useGetGroupById = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => getGroupById(id),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
    enabled: enabled && !!id,
  });
};
