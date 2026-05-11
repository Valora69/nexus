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

export const useCreatePayment = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { paymentData: CreatePaymentData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentData }) => createPayment(paymentData),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useUpdatePayment = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentData }) => updatePayment(id, paymentData),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};

export const useRemovePayment = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => removePayment(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
