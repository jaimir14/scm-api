import { z } from 'zod';

export const createClinicSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(255),
  direccion: z.string().min(1, 'Direccion is required').max(500),
  telefono: z.string().min(1, 'Telefono is required').max(50),
  email: z.string().email().max(255).optional().or(z.literal('')),
  estado: z.boolean().default(true),
});

export const updateClinicSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  direccion: z.string().min(1).max(500).optional(),
  telefono: z.string().min(1).max(50).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  estado: z.boolean().optional(),
});

export const clinicIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const clinicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  estado: z.coerce.boolean().optional(),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
export type ClinicQuery = z.infer<typeof clinicQuerySchema>;
