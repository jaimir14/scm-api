import { z } from 'zod';

const categoriaEnum = z.enum(['PREVENTIVO', 'CIRUGIA', 'RESTAURACION', 'ORTODONCIA']);

export const createTreatmentSchema = z.object({
  codigo: z.string().min(1, 'Codigo is required').max(50),
  nombre: z.string().min(1, 'Nombre is required').max(255),
  categoria: categoriaEnum,
  precio: z.number().positive('Precio must be positive'),
  estado: z.boolean().default(true),
});

export const updateTreatmentSchema = z.object({
  codigo: z.string().min(1).max(50).optional(),
  nombre: z.string().min(1).max(255).optional(),
  categoria: categoriaEnum.optional(),
  precio: z.number().positive().optional(),
  estado: z.boolean().optional(),
});

export const treatmentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const treatmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoria: categoriaEnum.optional(),
});

export type CreateTreatmentInput = z.infer<typeof createTreatmentSchema>;
export type UpdateTreatmentInput = z.infer<typeof updateTreatmentSchema>;
export type TreatmentQuery = z.infer<typeof treatmentQuerySchema>;
