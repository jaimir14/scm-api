import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().min(1, 'Phone is required').max(50),
});

export const updatePatientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  phone: z.string().min(1).max(50).optional(),
});

export const patientIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
