import { z } from 'zod';

export const updateExpenseSplitSchema = z.object({
  expenseId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
});

export const markAsPaidSchema = z.object({
  paymentMethod: z.enum(['GCASH', 'CASH']),
  amountPaid: z.number().positive(),
  paymentProof: z.string().optional(),
});

export const paginationSchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type UpdateExpenseSplitInput = z.infer<typeof updateExpenseSplitSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
