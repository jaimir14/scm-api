import { z } from 'zod';

export const presignedUrlSchema = z.object({
  pacienteId: z.number().int().positive(),
  citaId: z.number().int().positive(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export const registerImageSchema = z.object({
  consultaId: z.number().int().positive(),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const consultationIdParamSchema = z.object({
  consultaId: z.coerce.number().int().positive(),
});

export const imageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;
export type RegisterImageInput = z.infer<typeof registerImageSchema>;
