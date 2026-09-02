/**
 * Friend read hooks. Only the "all friends" list is exposed this stage —
 * the group member picker uses it as its source of selectable users.
 * The full friend-request suite (pending / sent / accept-by-token)
 * lands with the Friends tab in a later stage.
 */

import type { Friend } from '@repo/shared/types/entities';
import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import { getAllFriends } from '../services/friendService';

export function useGetAllFriends() {
  return useQuery<Friend[]>({
    queryKey: queryKeys.friends.all(),
    queryFn: getAllFriends,
    staleTime: 30 * 1000,
  });
}
