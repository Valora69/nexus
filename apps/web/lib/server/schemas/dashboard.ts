import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
