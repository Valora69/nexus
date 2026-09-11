import { prisma } from '@/lib/server/db';
import { ApiError } from '@/lib/server/errors';

/**
 * Throws 403 unless `userId` is a member of `groupId`. A missing group gets
 * the same 403, so group ids can't be probed for existence.
 */
export async function assertGroupMember(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { GroupMemberUnique: { userId, groupId } },
    select: { id: true },
  });
  if (!member) {
    throw new ApiError(403, 'You are not a member of this group');
  }
}
