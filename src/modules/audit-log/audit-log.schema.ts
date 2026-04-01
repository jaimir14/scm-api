import { z } from 'zod';

const accionEnum = z.enum(['INICIO_SESION', 'CREACION', 'ACTUALIZACION', 'ELIMINACION', 'CONSULTA']);

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  modulo: z.string().optional(),
  accion: accionEnum.optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
