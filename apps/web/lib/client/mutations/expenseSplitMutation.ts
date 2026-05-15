import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  markSplitAsPaid,
  updateExpenseSplit,
} from '../services/expenseSplitService';
import type {
  ExpenseSplitWithRelations,
  PaymentMethod,
  Payment,
} from '../../types/entities';

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

  return useMutation({
    mutationFn: ({ id, paymentMethod, amountPaid, paymentProof }) =>
      markSplitAsPaid(id, { paymentMethod, amountPaid, paymentProof }),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries — payments and dashboard are downstream
      queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  return useMutation({
    mutationFn: ({ id, data }) => updateExpenseSplit(id, data),
    onSuccess: (...args) => {
      // 🔄 Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
