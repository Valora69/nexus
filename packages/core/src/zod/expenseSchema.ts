import * as z from 'zod';

export const expenseFormSchema = z.object({
  name: z.string().min(1, 'Expense name is required'),
  totalAmount: z.number().positive('Amount must be greater than 0'),
  groupId: z.string().min(1, 'Group is required'),
  payeeId: z.string().min(1, 'Payee is required'),
  payerId: z.string().min(1, 'Payer is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
