import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboardService';
import { DashboardResponse } from '../../types/entities';
import { queryKeys } from '../queryKeys';

export const useGetDashboard = (month?: string, enabled = true) =>
  useQuery<DashboardResponse>({
    queryKey: queryKeys.dashboard.forMonth(month),
    queryFn: () => getDashboard(month),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled,
  });
