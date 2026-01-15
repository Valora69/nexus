import { BASE_URL } from "../config";
import { CreateExpenseData, UpdateExpenseData } from "../../types/model";

const EXPENSE_URI = "/expense";

export const createExpense = async (expenseData: CreateExpenseData) => {
  const data = await fetch(`${BASE_URL}${EXPENSE_URI}`, {
    method: "POST",
    body: JSON.stringify(expenseData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to create expense: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getAllExpenses = async () => {
  const data = await fetch(`${BASE_URL}${EXPENSE_URI}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch expenses: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getExpenseById = async (id: string) => {
  const data = await fetch(`${BASE_URL}${EXPENSE_URI}/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch expense: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const updateExpense = async (
  id: string,
  expenseData: UpdateExpenseData
) => {
  const data = await fetch(`${BASE_URL}${EXPENSE_URI}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(expenseData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to update expense: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const removeExpense = async (id: string) => {
  const data = await fetch(`${BASE_URL}${EXPENSE_URI}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to remove expense: ${data.statusText}`);
  }
};
