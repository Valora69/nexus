import { z } from 'zod';

export const googleMobileSignInSchema = z.object({
  idToken: z.string().min(1, 'idToken must not be empty'),
});

export type GoogleMobileSignInInput = z.infer<typeof googleMobileSignInSchema>;
