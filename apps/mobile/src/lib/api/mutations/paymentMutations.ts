/**
 * Payment mutations — mobile mirror of web's `paymentMutation.ts`.
 *
 * `useCreatePayment` routes through the stage-12 offline outbox choke
 * point (see `submitCreatePayment`), returning a discriminated
 * `SubmitResult<Payment>` so the caller can distinguish an online
 * `'sent'` write from an offline `'queued'` enqueue.
 *
 * `useUpdatePayment` doubles as the "verify" call: web flips
 * `isVerified: true` and the server auto-fills `verifiedAt` — same
 * contract mobile uses from the Home pending-verification section.
 * Updates are *not* queued offline: the plan explicitly scopes the
 * outbox to append-only creates, and 'record then verify' requires
 * a real server round-trip anyway.
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

import { useAuth } from '../../auth/auth-context';
import { submitCreatePayment, type SubmitResult } from '../../offline';
import { invalidatePaymentDomain } from '../invalidations';
import { removePayment, updatePayment } from '../services/paymentService';

export type CreatePaymentArgs = {
  paymentData: CreatePaymentData;
  clientRequestId: string;
};

export function useCreatePayment(
  mutationOptions?: UseMutationOptions<
    SubmitResult<Payment>,
    Error,
    CreatePaymentArgs
  >,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<SubmitResult<Payment>, Error, CreatePaymentArgs>({
    mutationFn: ({ paymentData, clientRequestId }) => {
      if (!user) {
        throw new Error('Cannot record a payment while signed out');
      }
      return submitCreatePayment(paymentData, {
        userId: user.sub,
        clientRequestId,
      });
    },
    ...mutationOptions,
    onSuccess: (result, ...rest) => {
      if (result.kind === 'sent') invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(result, ...rest);
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
