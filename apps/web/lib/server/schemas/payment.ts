import { z } from 'zod';

// `isVerified` is deliberately absent: payments always start unverified and
// only the expense payee can verify them (via PATCH). zod strips unknown
// keys, so a client sending `isVerified: true` here is ignored.
export const createPaymentSchema = z.object({
  expenseSplitId: z.string().uuid(),
  amountPaid: z.number().positive(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum(['GCASH', 'CASH']).optional(),
  paymentProof: z.string().optional(),
});

// Amount and target split are immutable once recorded — changing them would
// bypass the remaining-balance check in `create`. `isVerified` is payee-only,
// method/proof are split-owner-only (enforced in the service).
export const updatePaymentSchema = z.object({
  isVerified: z.boolean().optional(),
  paymentMethod: z.enum(['GCASH', 'CASH']).optional(),
  paymentProof: z.string().optional(),
});

export const paymentQuerySchema = z.object({
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
