import { z } from 'zod';

const estadoCitaEnum = z.enum(['PENDIENTE', 'ATENDIDA', 'CANCELADA']);

export const createAppointmentSchema = z.object({
  pacienteId: z.number().int().positive(),
  profesionalId: z.number().int().positive(),
  tipoCitaId: z.number().int().positive(),
  fecha: z.coerce.date(),
  horaInicio: z.string().min(1, 'Hora inicio is required').max(10),
  horaFin: z.string().min(1, 'Hora fin is required').max(10),
  notas: z.string().optional().or(z.literal('')),
  estado: estadoCitaEnum.default('PENDIENTE'),
});

export const updateAppointmentSchema = z.object({
  pacienteId: z.number().int().positive().optional(),
  profesionalId: z.number().int().positive().optional(),
  tipoCitaId: z.number().int().positive().optional(),
  fecha: z.coerce.date().optional(),
  horaInicio: z.string().min(1).max(10).optional(),
  horaFin: z.string().min(1).max(10).optional(),
  notas: z.string().optional().or(z.literal('')),
  estado: estadoCitaEnum.optional(),
});

export const updateAppointmentStatusSchema = z.object({
  estado: estadoCitaEnum,
});

export const appointmentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const appointmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  fecha: z.string().optional(),
  profesionalId: z.coerce.number().int().positive().optional(),
  clinicaId: z.coerce.number().int().positive().optional(),
  estado: estadoCitaEnum.optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
