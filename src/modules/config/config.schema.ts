import { z } from 'zod';

export const updateConfigSchema = z.object({
  nombreSistema: z.string().min(1).max(255).optional(),
  zonaHoraria: z.string().min(1).max(100).optional(),
  formatoFecha: z.string().min(1).max(50).optional(),
  duracionCitaDefecto: z.number().int().positive().optional(),
  horaInicioJornada: z.string().min(1).max(10).optional(),
  horaFinJornada: z.string().min(1).max(10).optional(),
  restriccionHorario: z.boolean().optional(),
  registrarBitacora: z.boolean().optional(),
  cambioPasswordDias: z.number().int().min(0).optional(),
  tiempoInactividad: z.number().int().positive().optional(),
  enviarRecordatorioEmail: z.boolean().optional(),
  notificarMedicoCitas: z.boolean().optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
