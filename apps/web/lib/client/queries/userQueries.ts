'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllUsers,
  getCurrentUser,
  getUserById,
} from '../services/userService';

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserById(id),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUsers'],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000, // ⏰ Cache for 5 minutes
  });
};
