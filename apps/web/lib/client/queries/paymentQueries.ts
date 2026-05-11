'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllPayments,
  getPaymentById,
  getPendingVerification,
  getPendingConfirmation,
} from '../services/paymentService';

export const useGetAllPayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => getAllPayments(),
    staleTime: 2 * 60 * 1000, // ⏰ Cache for 2 minutes
  });
};

export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => getPaymentById(id),
    staleTime: 2 * 60 * 1000, // ⏰ Cache for 2 minutes
  });
};

// Critical: Payments waiting for verification
export const useGetPendingVerification = () => {
  return useQuery({
    queryKey: ['payments', 'pending-verification'],
    queryFn: () => getPendingVerification(),
    staleTime: 1 * 60 * 1000, // ⏰ 1 minute - time-sensitive
    refetchOnMount: 'always', // ✅ Always fresh
    refetchOnWindowFocus: true, // ✅ Refetch on focus
  });
};

// Critical: Payments waiting for confirmation
export const useGetPendingConfirmation = () => {
  return useQuery({
    queryKey: ['payments', 'pending-confirmation'],
    queryFn: () => getPendingConfirmation(),
    staleTime: 1 * 60 * 1000, // ⏰ 1 minute - time-sensitive
    refetchOnMount: 'always', // ✅ Always fresh
    refetchOnWindowFocus: true, // ✅ Refetch on focus
  });
};
