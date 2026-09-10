/**
 * Activity read service. The endpoint accepts optional skip/take pagination;
 * the Activity tab starts with a single page and infinite-scroll can layer
 * on later without changing this signature.
 */

import type { ActivityWithRelations } from '@repo/shared/types/entities';

import { apiFetch } from '../client';

export function getAllActivities(
  skip?: number,
  take?: number,
): Promise<ActivityWithRelations[]> {
  const params = new URLSearchParams();
  if (skip !== undefined) params.set('skip', String(skip));
  if (take !== undefined) params.set('take', String(take));
  const qs = params.toString();
  return apiFetch<ActivityWithRelations[]>(
    `/api/activity${qs ? `?${qs}` : ''}`,
  );
}
