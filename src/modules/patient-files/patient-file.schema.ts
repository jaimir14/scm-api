import { z } from 'zod';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export const filePresignedUrlSchema = z.object({
  pacienteId: z.number().int().positive(),
  consultaId: z.number().int().positive().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1).refine(
    v => ALLOWED_MIME_TYPES.includes(v),
    'Solo se permiten archivos PDF',
  ),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, 'El archivo no puede superar 20MB'),
});

export const registerFileSchema = z.object({
  pacienteId: z.number().int().positive(),
  consultaId: z.number().int().positive().optional(),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const patientIdParamSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
});

export const consultationIdParamSchema = z.object({
  consultaId: z.coerce.number().int().positive(),
});

export const fileIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type FilePresignedUrlInput = z.infer<typeof filePresignedUrlSchema>;
export type RegisterFileInput = z.infer<typeof registerFileSchema>;
