import { z } from 'zod';

export const createGroupMemberSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateGroupMemberInput = z.infer<typeof createGroupMemberSchema>;
