import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { UpdateConfigInput } from './config.schema';

type SystemConfig = Awaited<ReturnType<typeof prisma.systemConfig.findFirstOrThrow>>;

export class ConfigService {
  async get(): Promise<SystemConfig> {
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (!config) {
      throw new NotFoundError('SystemConfig');
    }
    return config;
  }

  async update(input: UpdateConfigInput): Promise<SystemConfig> {
    // Upsert to handle case where config row doesn't exist yet
    return prisma.systemConfig.upsert({
      where: { id: 1 },
      update: input,
      create: {
        id: 1,
        nombreSistema: input.nombreSistema ?? 'Sistema de Clinica Medica',
        zonaHoraria: input.zonaHoraria ?? 'America/Costa_Rica',
        formatoFecha: input.formatoFecha ?? 'DD/MM/YYYY',
        duracionCitaDefecto: input.duracionCitaDefecto ?? 30,
        horaInicio: input.horaInicio ?? '08:00',
        horaFin: input.horaFin ?? '17:00',
        restriccionHorario: input.restriccionHorario ?? false,
        registrarBitacora: input.registrarBitacora ?? true,
        requerirCambioClave: input.requerirCambioClave ?? false,
        tiempoInactividad: input.tiempoInactividad ?? 30,
        recordatorioEmail: input.recordatorioEmail ?? false,
        notificarMedico: input.notificarMedico ?? false,
      },
    });
  }
}

export const configService = new ConfigService();
