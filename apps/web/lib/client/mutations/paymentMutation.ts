import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import {
  createPayment,
  updatePayment,
  removePayment,
} from "../services/paymentService";
import { CreatePaymentData, UpdatePaymentData } from "@/lib/types/model";

export const useCreatePayment = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { paymentData: CreatePaymentData }
  >
) =>
  useMutation({
    mutationFn: ({ paymentData }) => createPayment(paymentData),
    ...mutationOptions,
  });

export const useUpdatePayment = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; paymentData: UpdatePaymentData }
  >
) =>
  useMutation({
    mutationFn: ({ id, paymentData }) => updatePayment(id, paymentData),
    ...mutationOptions,
  });

export const useRemovePayment = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removePayment(id),
    ...mutationOptions,
  });
