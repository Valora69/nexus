/**
 * Home dashboard service. Mirrors `apps/web/lib/client/services/dashboardService`
 * — one endpoint, `GET /api/dashboard`, optionally scoped to a month
 * (`YYYY-MM`). The server returns an all-time debt view (net balance,
 * payables, receivables) plus a month-scoped `spent` figure and a
 * unified `recentFeed`.
 */

import type { DashboardResponse } from '@repo/shared/types/entities';

import { apiFetch } from '../client';

export function getDashboard(month?: string): Promise<DashboardResponse> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  return apiFetch<DashboardResponse>(`/api/dashboard${qs}`);
}
