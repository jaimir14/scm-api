import { z } from 'zod';

export const createAppointmentTypeSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(255),
  duracion: z.number().int().positive('Duracion must be positive'),
  estado: z.boolean().default(true),
});

export const updateAppointmentTypeSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  duracion: z.number().int().positive().optional(),
  estado: z.boolean().optional(),
});

export const appointmentTypeIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>;
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>;
