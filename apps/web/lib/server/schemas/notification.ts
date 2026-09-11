import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
