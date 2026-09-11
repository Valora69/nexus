import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createPayment,
  updatePayment,
  removePayment,
} from '../services/paymentService';
import { CreatePaymentData, UpdatePaymentData } from '../../types/request';
import type { Payment } from '../../types/entities';
import {
  applyVerifiedPayment,
  invalidatePaymentDomain,
} from '../invalidations';

export const useCreatePayment = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { paymentData: CreatePaymentData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { paymentData: CreatePaymentData }>({
    mutationFn: ({ paymentData }) => createPayment(paymentData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};

export const useUpdatePayment = (
  mutationOptions: UseMutationOptions<
    Payment,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    Payment,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >({
    mutationFn: ({ id, paymentData }) => updatePayment(id, paymentData),
    ...mutationOptions,
    onSuccess: (...args) => {
      // Verify is the hot path: paint the server's result into every cached
      // view immediately, then refetch to reconcile.
      if (args[0]?.isVerified) applyVerifiedPayment(queryClient, args[0]);
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};

export const useRemovePayment = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => removePayment(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
};
