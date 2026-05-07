import { z } from 'zod';

const tipoIdentificacionEnum = z.enum(['CEDULA', 'PASAPORTE', 'RESIDENCIA']);
const sexoEnum = z.enum(['MASCULINO', 'FEMENINO']);

export const createUserSchema = z.object({
  usuario: z.string().min(1, 'Usuario is required').max(100),
  nombre: z.string().min(1, 'Nombre is required').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
  rolId: z.number().int().positive(),
  tipoIdentificacion: tipoIdentificacionEnum,
  numeroIdentificacion: z.string().min(1, 'Numero de identificacion is required').max(50),
  sexo: sexoEnum,
  especialidad: z.string().min(1).max(255).optional().nullable(),
  clinicaId: z.number().int().positive(),
  fotografia: z.string().max(500).optional().nullable(),
  email: z.preprocess(v => (v === '' ? null : v), z.string().email('Correo electrónico inválido').max(255).optional().nullable()),
  telefono: z.preprocess(v => (v === '' ? null : v), z.string().regex(/^[2678]\d{3}-?\d{4}$/, 'Teléfono costarricense inválido').optional().nullable()),
  // Doctor-specific
  codigoProfesional: z.string().max(100).optional().nullable(),
  duracionCitas: z.number().int().positive().optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  // Google Calendar
  googleCalendarActivo: z.boolean().default(false).optional(),
  googleCalendarEmail: z.string().max(255).optional().nullable(),
  googleClientId: z.string().max(500).optional().nullable(),
  googleClientSecret: z.string().max(500).optional().nullable(),
  estado: z.boolean().default(true).optional(),
});

export const updateUserSchema = z.object({
  usuario: z.string().min(1).max(100).optional(),
  nombre: z.string().min(1).max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  rolId: z.number().int().positive().optional(),
  tipoIdentificacion: tipoIdentificacionEnum.optional(),
  numeroIdentificacion: z.string().min(1).max(50).optional(),
  sexo: sexoEnum.optional(),
  especialidad: z.string().min(1).max(255).optional().nullable(),
  clinicaId: z.number().int().positive().optional(),
  fotografia: z.string().max(500).optional().nullable(),
  email: z.preprocess(v => (v === '' ? null : v), z.string().email('Correo electrónico inválido').max(255).optional().nullable()),
  telefono: z.preprocess(v => (v === '' ? null : v), z.string().regex(/^[2678]\d{3}-?\d{4}$/, 'Teléfono costarricense inválido').optional().nullable()),
  // Doctor-specific
  codigoProfesional: z.string().max(100).optional().nullable(),
  duracionCitas: z.number().int().positive().optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  // Google Calendar
  googleCalendarActivo: z.boolean().optional(),
  googleCalendarEmail: z.string().max(255).optional().nullable(),
  googleClientId: z.string().max(500).optional().nullable(),
  googleClientSecret: z.string().max(500).optional().nullable(),
  estado: z.boolean().optional(),
});

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
