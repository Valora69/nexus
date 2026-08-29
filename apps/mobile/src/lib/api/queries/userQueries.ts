/**
 * Exemplar for the mobile query-hook layer.
 *
 * Rules:
 *   - Every hook uses a key from `@repo/shared/queryKeys` — no ad-hoc
 *     string arrays, so web and mobile invalidate the same cache slots.
 *   - `queryFn` calls a service function; hooks never fetch directly.
 *   - Per-hook overrides (e.g. bumped staleTime for slow-changing data)
 *     live here, not in the global QueryClient defaults.
 */

import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getCurrentUser, getUserById } from '../services/userService';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: getCurrentUser,
    staleTime: 60 * 1000,
  });
}

export function useUserById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.byId(id ?? ''),
    queryFn: () => getUserById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
