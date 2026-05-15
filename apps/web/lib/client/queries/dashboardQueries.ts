import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboardService';
import { DashboardResponse } from '../../types/entities';

export const useGetDashboard = (month?: string, enabled = true) =>
  useQuery<DashboardResponse>({
    queryKey: ['dashboard', month ?? 'current'],
    queryFn: () => getDashboard(month),
    staleTime: 1 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled,
  });
