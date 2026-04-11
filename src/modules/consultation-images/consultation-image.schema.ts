import { z } from 'zod';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

export const presignedUrlSchema = z.object({
  pacienteId: z.number().int().positive(),
  citaId: z.number().int().positive(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1).refine(v => v.startsWith('image/'), 'Solo se permiten imagenes'),
  fileSize: z.number().int().positive().max(MAX_IMAGE_SIZE, 'La imagen no puede superar 20MB'),
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
