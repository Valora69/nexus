/**
 * Group-member add / remove service. Mirrors
 * `apps/web/lib/client/services/groupMemberService.ts`.
 *
 * DELETE returns 409 with a `blockers` array when the member has
 * unsettled balances or pending payments in the group. We expose a
 * typed `RemoveMemberConflictError` so screens can render each blocker
 * as a specific message instead of a generic failure toast.
 */

import type { GroupMember } from '@repo/shared/types/entities';
import type { CreateGroupMemberData } from '@repo/shared/types/request';

import { ApiError, apiFetch } from '../client';

export type RemovalBlocker = {
  type: string;
  message: string;
};

export class RemoveMemberConflictError extends Error {
  readonly blockers: RemovalBlocker[];
  constructor(message: string, blockers: RemovalBlocker[]) {
    super(message);
    this.name = 'RemoveMemberConflictError';
    this.blockers = blockers;
  }
}

export function createGroupMember(
  data: CreateGroupMemberData,
): Promise<GroupMember> {
  return apiFetch<GroupMember>('/api/group-member', {
    method: 'POST',
    json: data,
  });
}

export async function removeGroupMember(id: string): Promise<void> {
  try {
    await apiFetch<void>(`/api/group-member/${id}`, { method: 'DELETE' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const payload = err.payload as { blockers?: RemovalBlocker[] } | null;
      throw new RemoveMemberConflictError(
        err.message,
        Array.isArray(payload?.blockers) ? payload!.blockers : [],
      );
    }
    throw err;
  }
}
