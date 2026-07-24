import { z } from 'zod';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';

export const createActivitySchema = z.object({
  activityName: z.nativeEnum(ActivityNameEnum),
  activityOn: z.nativeEnum(ActivityOnEnum),
  groupId: z.string().min(1),
  createdByUserId: z.string().min(1),
});

export const activityQuerySchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
