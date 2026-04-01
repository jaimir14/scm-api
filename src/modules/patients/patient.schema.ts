import { z } from 'zod';

const tipoIdentificacionEnum = z.enum(['CEDULA', 'PASAPORTE', 'RESIDENCIA']);
const sexoEnum = z.enum(['MASCULINO', 'FEMENINO']);
const estadoCivilEnum = z.enum(['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO']);

export const createPatientSchema = z.object({
  nombre: z.string().min(1, 'Nombre is required').max(255),
  apellido1: z.string().min(1, 'Apellido1 is required').max(255),
  apellido2: z.string().max(255).optional().or(z.literal('')),
  tipoIdentificacion: tipoIdentificacionEnum,
  numeroIdentificacion: z.string().min(1, 'Numero identificacion is required').max(50),
  telefonoCelular: z.string().min(1, 'Telefono celular is required').max(50),
  telefonoCasa: z.string().max(50).optional().or(z.literal('')),
  telefonoTrabajo: z.string().max(50).optional().or(z.literal('')),
  otroTelefono: z.string().max(50).optional().or(z.literal('')),
  sexo: sexoEnum,
  estadoCivil: estadoCivilEnum,
  direccion: z.string().min(1, 'Direccion is required').max(500),
  email: z.string().email().max(255).optional().or(z.literal('')),
  ocupacion: z.string().max(255).optional().or(z.literal('')),
  fechaNacimiento: z.coerce.date(),
  tipoSangre: z.string().max(10).optional().or(z.literal('')),
  clinicaId: z.number().int().positive(),
  profesionalId: z.number().int().positive(),
  fotografia: z.string().max(500).optional().or(z.literal('')),
  antecedentesPatologicos: z.string().optional().or(z.literal('')),
  antecedentesNoPatologicos: z.any().optional(),
  antecedentesQuirurgicos: z.string().optional().or(z.literal('')),
  antecedentesGinecoObstetricos: z.any().optional(),
  antecedentesHeredoFamiliares: z.string().optional().or(z.literal('')),
  otrosAntecedentes: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
  estado: z.boolean().default(true),
});

export const updatePatientSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  apellido1: z.string().min(1).max(255).optional(),
  apellido2: z.string().max(255).optional().or(z.literal('')),
  tipoIdentificacion: tipoIdentificacionEnum.optional(),
  numeroIdentificacion: z.string().min(1).max(50).optional(),
  telefonoCelular: z.string().min(1).max(50).optional(),
  telefonoCasa: z.string().max(50).optional().or(z.literal('')),
  telefonoTrabajo: z.string().max(50).optional().or(z.literal('')),
  otroTelefono: z.string().max(50).optional().or(z.literal('')),
  sexo: sexoEnum.optional(),
  estadoCivil: estadoCivilEnum.optional(),
  direccion: z.string().min(1).max(500).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  ocupacion: z.string().max(255).optional().or(z.literal('')),
  fechaNacimiento: z.coerce.date().optional(),
  tipoSangre: z.string().max(10).optional().or(z.literal('')),
  clinicaId: z.number().int().positive().optional(),
  profesionalId: z.number().int().positive().optional(),
  fotografia: z.string().max(500).optional().or(z.literal('')),
  antecedentesPatologicos: z.string().optional().or(z.literal('')),
  antecedentesNoPatologicos: z.any().optional(),
  antecedentesQuirurgicos: z.string().optional().or(z.literal('')),
  antecedentesGinecoObstetricos: z.any().optional(),
  antecedentesHeredoFamiliares: z.string().optional().or(z.literal('')),
  otrosAntecedentes: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
  estado: z.boolean().optional(),
});

export const patientIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const patientSearchSchema = z.object({
  q: z.string().min(1, 'Search term is required'),
  type: z.enum(['nombre', 'cedula']).default('nombre'),
});

export const profesionalIdParamSchema = z.object({
  profesionalId: z.coerce.number().int().positive(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientSearchQuery = z.infer<typeof patientSearchSchema>;
