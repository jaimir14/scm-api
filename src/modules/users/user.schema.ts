import { z } from 'zod';

const rolEnum = z.enum(['ADMINISTRADOR', 'MEDICO', 'RECEPCION', 'ENFERMERIA']);

export const createUserSchema = z.object({
  usuario: z.string().min(1, 'Usuario is required').max(100),
  nombre: z.string().min(1, 'Nombre is required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
  rol: rolEnum,
  especialidad: z.string().min(1).max(255).optional().nullable(),
  clinicaId: z.number().int().positive().optional().nullable(),
  estado: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  usuario: z.string().min(1).max(100).optional(),
  nombre: z.string().min(1).max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  rol: rolEnum.optional(),
  especialidad: z.string().min(1).max(255).optional().nullable(),
  clinicaId: z.number().int().positive().optional().nullable(),
  estado: z.boolean().optional(),
});

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
