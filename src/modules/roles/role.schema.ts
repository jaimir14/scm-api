import { z } from 'zod';

export const createRoleSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(100),
  descripcion: z.string().optional().nullable(),
  esAdmin: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export const updateRoleSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().optional().nullable(),
  esAdmin: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export const roleIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const syncFeaturesSchema = z.object({
  featureKeys: z.array(z.string().min(1)),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
