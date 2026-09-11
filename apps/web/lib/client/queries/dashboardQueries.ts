import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboardService';
import { DashboardResponse } from '../../types/entities';
import { queryKeys } from '../queryKeys';
import { LIVE_REFETCH } from '../live';

export const useGetDashboard = (month?: string, enabled = true) =>
  useQuery<DashboardResponse>({
    queryKey: queryKeys.dashboard.forMonth(month),
    ...LIVE_REFETCH,
    queryFn: () => getDashboard(month),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled,
  });
