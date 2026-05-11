import { BASE_URL } from '../config';
import type { QuickCaptureData } from '../../types/request';
import type { PersonalTransactionType } from '../../types/entities';

const URI = '/personal-transactions';

export const quickCapture = async (data: QuickCaptureData) => {
  const res = await fetch(`${BASE_URL}${URI}/quick-capture`, {
    method: 'POST',
    body: JSON.stringify(data),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to save transaction');
  }

  return res.json();
};

export const getAllPersonalTransactions = async (type?: PersonalTransactionType) => {
  const params = type ? `?type=${type}` : '';
  const res = await fetch(`${BASE_URL}${URI}${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const getPersonalTransactionSummary = async () => {
  const res = await fetch(`${BASE_URL}${URI}/summary`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
};
