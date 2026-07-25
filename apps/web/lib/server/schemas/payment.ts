import { z } from 'zod';

export const createPaymentSchema = z.object({
  expenseSplitId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum(['GCASH', 'CASH']).optional(),
  paymentProof: z.string().optional(),
  isVerified: z.boolean().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const paymentQuerySchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
