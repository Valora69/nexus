"use client";
import { useQuery } from "@tanstack/react-query";

import { getAllPayments, getPaymentById } from "../services/paymentService";

export const useGetAllPayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => getAllPayments(),
  });
};

export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => getPaymentById(id),
  });
};
