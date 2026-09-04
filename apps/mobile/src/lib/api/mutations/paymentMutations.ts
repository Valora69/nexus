/**
 * Payment mutations — mobile mirror of web's `paymentMutation.ts`.
 *
 * `useCreatePayment` accepts `clientRequestId` alongside the payload so
 * stage 12's outbox can generate an id, stash the request, and replay
 * it against the same choke point on reconnect without needing a
 * parallel mutation.
 *
 * `useUpdatePayment` doubles as the "verify" call: web flips
 * `isVerified: true` and the server auto-fills `verifiedAt` — same
 * contract mobile uses from the Home pending-verification section.
 */

import type { Payment } from '@repo/shared/types/entities';
import type {
  CreatePaymentData,
  UpdatePaymentData,
} from '@repo/shared/types/request';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import { invalidatePaymentDomain } from '../invalidations';
import {
  createPayment,
  removePayment,
  updatePayment,
} from '../services/paymentService';

export type CreatePaymentArgs = {
  paymentData: CreatePaymentData;
  clientRequestId?: string;
};

export function useCreatePayment(
  mutationOptions?: UseMutationOptions<Payment, Error, CreatePaymentArgs>,
) {
  const queryClient = useQueryClient();
  return useMutation<Payment, Error, CreatePaymentArgs>({
    mutationFn: ({ paymentData, clientRequestId }) =>
      createPayment(paymentData, { clientRequestId }),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useUpdatePayment(
  mutationOptions?: UseMutationOptions<
    Payment,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    Payment,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >({
    mutationFn: ({ id, paymentData }) => updatePayment(id, paymentData),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}

export function useRemovePayment(
  mutationOptions?: UseMutationOptions<void, Error, { id: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => removePayment(id),
    ...mutationOptions,
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
  });
}
