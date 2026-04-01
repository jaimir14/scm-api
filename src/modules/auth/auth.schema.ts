import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuario is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
