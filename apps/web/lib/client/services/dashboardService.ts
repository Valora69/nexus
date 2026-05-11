import { BASE_URL } from '../config';
import { DashboardResponse } from '../../types/entities';

export const getDashboard = async (month?: string): Promise<DashboardResponse> => {
  const params = month ? `?month=${month}` : '';
  const res = await fetch(`${BASE_URL}/dashboard${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.statusText}`);
  }

  return res.json();
};
