import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';

import {
  markSplitAsPaid,
  updateExpenseSplit,
} from '../services/expenseSplitService';
import type {
  ExpenseSplitWithRelations,
  PaymentMethod,
  Payment,
} from '../../types/entities';
import { invalidatePaymentDomain } from '../invalidations';

type MarkAsPaidResponse = {
  payment: Payment;
  expenseSplit: ExpenseSplitWithRelations;
};

type MarkAsPaidInput = {
  id: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  paymentProof?: string;
};

export const useMarkSplitAsPaid = (
  mutationOptions?: UseMutationOptions<
    MarkAsPaidResponse,
    Error,
    MarkAsPaidInput
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<MarkAsPaidResponse, Error, MarkAsPaidInput>({
    mutationFn: ({ id, paymentMethod, amountPaid, paymentProof }) =>
      markSplitAsPaid(id, { paymentMethod, amountPaid, paymentProof }),
    onSuccess: (...args) => {
      // Mark-as-paid produces a Payment row — payment domain covers all surfaces.
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useUpdateExpenseSplit = (
  mutationOptions?: UseMutationOptions<
    ExpenseSplitWithRelations,
    Error,
    { id: string; data: { isPaid?: boolean; amount?: number } }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    ExpenseSplitWithRelations,
    Error,
    { id: string; data: { isPaid?: boolean; amount?: number } }
  >({
    mutationFn: ({ id, data }) => updateExpenseSplit(id, data),
    onSuccess: (...args) => {
      invalidatePaymentDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
