import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  email: z.string().email(),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

export const acceptRequestByTokenSchema = z.object({
  token: z.string(),
});

export type AcceptRequestByTokenInput = z.infer<
  typeof acceptRequestByTokenSchema
>;

export const paginationQuerySchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
