/**
 * TanStack Query hook for the home dashboard. Matches web's
 * `useGetDashboard`: same key shape, same 1-minute staleTime, so a
 * cache primed on one surface is honored on the other.
 */

import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getDashboard } from '../services/dashboardService';

export function useDashboard(month?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.forMonth(month),
    queryFn: () => getDashboard(month),
    staleTime: 60 * 1000,
    enabled,
  });
}
