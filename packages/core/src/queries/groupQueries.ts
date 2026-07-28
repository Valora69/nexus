'use client';
import { useQuery } from '@tanstack/react-query';

import { getAllGroups, getGroupById } from '../services/groupService';
import { queryKeys } from '../queryKeys';

export const useGetAllGroups = () => {
  return useQuery({
    queryKey: queryKeys.groups.all(),
    queryFn: () => getAllGroups(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetGroupById = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.groups.byId(id),
    queryFn: () => getGroupById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id,
  });
};
