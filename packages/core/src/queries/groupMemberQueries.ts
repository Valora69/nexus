'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllGroupMembers,
  getGroupMemberById,
} from '../services/groupMemberService';
import { queryKeys } from '../queryKeys';

export const useGetAllGroupMembers = () => {
  return useQuery({
    queryKey: queryKeys.groupMembers.all(),
    queryFn: () => getAllGroupMembers(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetGroupMemberById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.groupMembers.byId(id),
    queryFn: () => getGroupMemberById(id),
    staleTime: 5 * 60 * 1000,
  });
};
