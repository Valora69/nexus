/**
 * Payment read hooks. Keys mirror web (`queryKeys.payments.*`) so a
 * verify from either surface invalidates both, and per-hook staleTime
 * favours the "waiting on the other side" flows — pending lists are
 * checked at every mount because a verify on the other device flips
 * them without any local trigger.
 */

import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import {
  getAllPayments,
  getPaymentById,
  getPendingConfirmation,
  getPendingVerification,
} from '../services/paymentService';

export function useGetAllPayments() {
  return useQuery({
    queryKey: queryKeys.payments.all(),
    queryFn: getAllPayments,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetPaymentById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.payments.byId(id ?? ''),
    queryFn: () => getPaymentById(id as string),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/** Payments where the current user is the payee and still needs to confirm receipt. */
export function useGetPendingVerification() {
  return useQuery({
    queryKey: queryKeys.payments.pendingVerification(),
    queryFn: getPendingVerification,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
  });
}

/** Payments the current user made that the payee hasn't verified yet. */
export function useGetPendingConfirmation() {
  return useQuery({
    queryKey: queryKeys.payments.pendingConfirmation(),
    queryFn: getPendingConfirmation,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
  });
}
