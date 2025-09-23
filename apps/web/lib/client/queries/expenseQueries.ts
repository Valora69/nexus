"use client";
import { useQuery } from "@tanstack/react-query";

import { getAllExpenses, getExpenseById } from "../services/expenseService";

export const useGetAllExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => getAllExpenses(),
  });
};

export const useGetExpenseById = (id: string) => {
  return useQuery({
    queryKey: ["expenses", id],
    queryFn: () => getExpenseById(id),
  });
};
