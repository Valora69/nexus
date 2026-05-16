'use client';
import { useQuery } from '@tanstack/react-query';

import {
  getAllPayments,
  getPaymentById,
  getPendingVerification,
  getPendingConfirmation,
} from '../services/paymentService';
import { queryKeys } from '../queryKeys';

export const useGetAllPayments = () => {
  return useQuery({
    queryKey: queryKeys.payments.all(),
    queryFn: () => getAllPayments(),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.payments.byId(id),
    queryFn: () => getPaymentById(id),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
};

// Critical: Payments waiting for verification (receivable side).
export const useGetPendingVerification = () => {
  return useQuery({
    queryKey: queryKeys.payments.pendingVerification(),
    queryFn: () => getPendingVerification(),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

// Critical: Payments waiting for confirmation (payable side).
export const useGetPendingConfirmation = () => {
  return useQuery({
    queryKey: queryKeys.payments.pendingConfirmation(),
    queryFn: () => getPendingConfirmation(),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};
