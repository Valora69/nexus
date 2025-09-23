import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import {
  createExpense,
  updateExpense,
  removeExpense,
} from "../services/expenseService";
import { CreateExpenseData, UpdateExpenseData } from "@/lib/types/model";

export const useCreateExpense = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { expenseData: CreateExpenseData }
  >
) =>
  useMutation({
    mutationFn: ({ expenseData }) => createExpense(expenseData),
    ...mutationOptions,
  });

export const useUpdateExpense = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; expenseData: UpdateExpenseData }
  >
) =>
  useMutation({
    mutationFn: ({ id, expenseData }) => updateExpense(id, expenseData),
    ...mutationOptions,
  });

export const useRemoveExpense = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removeExpense(id),
    ...mutationOptions,
  });
