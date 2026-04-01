import { z } from 'zod';

// Helper: coerce to number, treat empty string as undefined
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().positive().optional(),
);
const optionalInt = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().int().positive().optional(),
);
const requiredNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().positive({ message: 'Peso es requerido' }),
);

export const createConsultationSchema = z.object({
  pacienteId: z.number().int().positive(),
  profesionalId: z.number().int().positive(),
  fecha: z.coerce.date(),
  ocultar: z.boolean().default(false),
  peso: requiredNumber,
  talla: optionalNumber,
  imc: optionalNumber,
  temperatura: optionalNumber,
  presionArterial: z.string().max(20).optional().or(z.literal('')),
  frecuenciaCardiaca: optionalInt,
  frecuenciaRespiratoria: optionalInt,
  satO2: optionalNumber,
  motivoConsulta: z.string().min(1, 'Motivo de consulta es requerido'),
  examenFisico: z.string().optional().or(z.literal('')),
  impresionDiagnostica: z.string().optional().or(z.literal('')),
  indicacionesTratamientos: z.string().optional().or(z.literal('')),
});

export const updateConsultationSchema = z.object({
  profesionalId: z.number().int().positive().optional(),
  fecha: z.coerce.date().optional(),
  ocultar: z.boolean().optional(),
  peso: optionalNumber.nullable(),
  talla: optionalNumber.nullable(),
  imc: optionalNumber.nullable(),
  temperatura: optionalNumber.nullable(),
  presionArterial: z.string().max(20).optional().or(z.literal('')).nullable(),
  frecuenciaCardiaca: optionalInt.nullable(),
  frecuenciaRespiratoria: optionalInt.nullable(),
  satO2: optionalNumber.nullable(),
  motivoConsulta: z.string().optional().or(z.literal('')).nullable(),
  examenFisico: z.string().optional().or(z.literal('')).nullable(),
  impresionDiagnostica: z.string().optional().or(z.literal('')).nullable(),
  indicacionesTratamientos: z.string().optional().or(z.literal('')).nullable(),
});

export const consultationIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const patientIdParamSchema = z.object({
  patientId: z.coerce.number().int().positive(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
