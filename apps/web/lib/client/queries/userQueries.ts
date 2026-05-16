'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllUsers,
  getCurrentUser,
  getUserById,
} from '../services/userService';
import { queryKeys } from '../queryKeys';

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: queryKeys.user.all(),
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.user.byId(id),
    queryFn: () => getUserById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: () => getCurrentUser(),
    staleTime: 60 * 1000,
  });
};
