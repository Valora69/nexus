import { z } from 'zod';
import { PersonalTransactionType } from '@prisma/client';

export const quickCaptureInputSchema = z.object({
  input: z.string().min(1),
});

export const createPersonalTransactionSchema = z.object({
  type: z.nativeEnum(PersonalTransactionType),
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
});

export const personalTransactionQuerySchema = z.object({
  type: z.nativeEnum(PersonalTransactionType).optional(),
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type QuickCaptureInput = z.infer<typeof quickCaptureInputSchema>;
export type CreatePersonalTransactionInput = z.infer<
  typeof createPersonalTransactionSchema
>;
export type PersonalTransactionQuery = z.infer<
  typeof personalTransactionQuerySchema
>;
