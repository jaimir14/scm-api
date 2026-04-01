import { z } from 'zod';

export const appointmentReportSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  profesionalId: z.coerce.number().int().positive().optional(),
  clinicaId: z.coerce.number().int().positive().optional(),
  estado: z.enum(['PENDIENTE', 'ATENDIDA', 'CANCELADA']).optional(),
});

export const patientReportSchema = z.object({
  clinicaId: z.coerce.number().int().positive().optional(),
  profesionalId: z.coerce.number().int().positive().optional(),
  sexo: z.enum(['MASCULINO', 'FEMENINO']).optional(),
});

export const clinicReportSchema = z.object({
  estado: z.coerce.boolean().optional(),
});

export const treatmentReportSchema = z.object({
  categoria: z.enum(['PREVENTIVO', 'CIRUGIA', 'RESTAURACION', 'ORTODONCIA']).optional(),
});

export const userReportSchema = z.object({
  rol: z.enum(['ADMINISTRADOR', 'MEDICO', 'RECEPCION', 'ENFERMERIA']).optional(),
  estado: z.coerce.boolean().optional(),
});

export type AppointmentReportQuery = z.infer<typeof appointmentReportSchema>;
export type PatientReportQuery = z.infer<typeof patientReportSchema>;
export type ClinicReportQuery = z.infer<typeof clinicReportSchema>;
export type TreatmentReportQuery = z.infer<typeof treatmentReportSchema>;
export type UserReportQuery = z.infer<typeof userReportSchema>;
