import { BASE_URL } from '../config';
import type {
  ExpenseSplitWithRelations,
  PaymentMethod,
  Payment,
} from '../../types/entities';

type MarkAsPaidResponse = {
  payment: Payment;
  expenseSplit: ExpenseSplitWithRelations;
};

const EXPENSE_SPLIT_URI = '/expense-splits';

export const getAllExpenseSplits = async (): Promise<
  ExpenseSplitWithRelations[]
> => {
  const response = await fetch(`${BASE_URL}${EXPENSE_SPLIT_URI}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch expense splits: ${response.statusText}`);
  }

  return response.json();
};

export const getMyPayableSplits = async (): Promise<
  ExpenseSplitWithRelations[]
> => {
  const response = await fetch(`${BASE_URL}${EXPENSE_SPLIT_URI}/my-payables`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch payable splits: ${response.statusText}`);
  }

  return response.json();
};

export const getMyReceivableSplits = async (): Promise<
  ExpenseSplitWithRelations[]
> => {
  const response = await fetch(
    `${BASE_URL}${EXPENSE_SPLIT_URI}/my-receivables`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch receivable splits: ${response.statusText}`,
    );
  }

  return response.json();
};

export const getSplitsByExpenseId = async (
  expenseId: string,
): Promise<ExpenseSplitWithRelations[]> => {
  const response = await fetch(
    `${BASE_URL}${EXPENSE_SPLIT_URI}/expense/${expenseId}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch splits by expense: ${response.statusText}`,
    );
  }

  return response.json();
};

export const getSplitsByUserId = async (
  userId: string,
): Promise<ExpenseSplitWithRelations[]> => {
  const response = await fetch(
    `${BASE_URL}${EXPENSE_SPLIT_URI}/user/${userId}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch splits by user: ${response.statusText}`);
  }

  return response.json();
};

export const getExpenseSplitById = async (
  id: string,
): Promise<ExpenseSplitWithRelations> => {
  const response = await fetch(`${BASE_URL}${EXPENSE_SPLIT_URI}/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch expense split: ${response.statusText}`);
  }

  return response.json();
};

export const markSplitAsPaid = async (
  id: string,
  body: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    paymentProof?: string;
  },
): Promise<MarkAsPaidResponse> => {
  const response = await fetch(
    `${BASE_URL}${EXPENSE_SPLIT_URI}/${id}/mark-paid`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(
      errBody?.message ??
        `Failed to mark split as paid: ${response.statusText}`,
    );
  }

  return response.json();
};

export const updateExpenseSplit = async (
  id: string,
  data: { amount?: number },
): Promise<ExpenseSplitWithRelations> => {
  const response = await fetch(`${BASE_URL}${EXPENSE_SPLIT_URI}/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update expense split: ${response.statusText}`);
  }

  return response.json();
};
