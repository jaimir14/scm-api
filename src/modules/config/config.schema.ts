import { z } from 'zod';

export const updateConfigSchema = z.object({
  nombreSistema: z.string().min(1).max(255).optional(),
  zonaHoraria: z.string().min(1).max(100).optional(),
  formatoFecha: z.string().min(1).max(50).optional(),
  duracionCitaDefecto: z.number().int().positive().optional(),
  horaInicio: z.string().min(1).max(10).optional(),
  horaFin: z.string().min(1).max(10).optional(),
  restriccionHorario: z.boolean().optional(),
  registrarBitacora: z.boolean().optional(),
  requerirCambioClave: z.boolean().optional(),
  tiempoInactividad: z.number().int().positive().optional(),
  recordatorioEmail: z.boolean().optional(),
  notificarMedico: z.boolean().optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
