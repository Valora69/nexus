import { z } from 'zod';

export const expenseSplitInputSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  isPaid: z.boolean().optional(),
});

export const createExpenseSchema = z.object({
  name: z.string().min(1),
  totalAmount: z.number().positive(),
  groupId: z.string().uuid(),
  payerId: z.string().uuid(),
  payeeId: z.string().uuid().optional(),
  date: z.string(),
  notes: z.string().optional(),
  splits: z.array(expenseSplitInputSchema).min(1).optional(),
});

export const createManyExpensesSchema = z.object({
  expenses: z.array(createExpenseSchema),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  type: z.enum(['payable', 'receivable']).optional(),
  groupId: z.string().optional(),
  skip: z.coerce.number().int().optional(),
  take: z.coerce.number().int().optional(),
});

export type ExpenseSplitInput = z.infer<typeof expenseSplitInputSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateManyExpensesInput = z.infer<typeof createManyExpensesSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
