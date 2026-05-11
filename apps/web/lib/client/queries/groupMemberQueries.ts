'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllGroupMembers,
  getGroupMemberById,
} from '../services/groupMemberService';

export const useGetAllGroupMembers = () => {
  return useQuery({
    queryKey: ['groupMembers'],
    queryFn: () => getAllGroupMembers(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useGetGroupMemberById = (id: string) => {
  return useQuery({
    queryKey: ['groupMembers', id],
    queryFn: () => getGroupMemberById(id),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};
