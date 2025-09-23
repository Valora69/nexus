import { BASE_URL } from "../config";
import {
  CreatePaymentData,
  UpdatePaymentData,
  Payment,
} from "../../types/model";

const PAYMENT_URI = "/payment";

export const createPayment = async (
  paymentData: CreatePaymentData
): Promise<Payment> => {
  const data = await fetch(`${BASE_URL}${PAYMENT_URI}`, {
    method: "POST",
    body: JSON.stringify(paymentData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to create payment: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const data = await fetch(`${BASE_URL}${PAYMENT_URI}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch payments: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  const data = await fetch(`${BASE_URL}${PAYMENT_URI}/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch payment: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const updatePayment = async (
  id: string,
  paymentData: UpdatePaymentData
): Promise<Payment> => {
  const data = await fetch(`${BASE_URL}${PAYMENT_URI}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to update payment: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const removePayment = async (id: string): Promise<void> => {
  const data = await fetch(`${BASE_URL}${PAYMENT_URI}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to remove payment: ${data.statusText}`);
  }
};
