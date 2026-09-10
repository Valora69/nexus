/**
 * Activity read hooks. Server keys the domain root under `activities`;
 * paginated pages share that prefix so a single `invalidateQueries` on
 * the root invalidates every page.
 */

import type { ActivityWithRelations } from '@repo/shared/types/entities';
import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getAllActivities } from '../services/activityService';

export function useGetAllActivities(skip?: number, take?: number) {
  return useQuery<ActivityWithRelations[]>({
    queryKey: queryKeys.activities.page(skip, take),
    queryFn: () => getAllActivities(skip, take),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });
}
