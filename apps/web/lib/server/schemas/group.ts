import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const groupQuerySchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type GroupQuery = z.infer<typeof groupQuerySchema>;
