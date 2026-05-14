import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { UpdateConfigInput } from './config.schema';

type RawConfig = Awaited<ReturnType<typeof prisma.systemConfig.findFirstOrThrow>>;

export interface SystemConfigResponse {
  nombreSistema: string;
  zonaHoraria: string;
  formatoFecha: string;
  duracionCitaDefecto: number;
  horaInicioJornada: string;
  horaFinJornada: string;
  restriccionHorario: boolean;
  registrarBitacora: boolean;
  cambioPasswordDias: number;
  tiempoInactividad: number;
  enviarRecordatorioEmail: boolean;
  notificarMedicoCitas: boolean;
  updatedAt: Date;
}

function toResponse(raw: RawConfig): SystemConfigResponse {
  return {
    nombreSistema: raw.nombreSistema,
    zonaHoraria: raw.zonaHoraria,
    formatoFecha: raw.formatoFecha,
    duracionCitaDefecto: raw.duracionCitaDefecto,
    horaInicioJornada: raw.horaInicioJornada,
    horaFinJornada: raw.horaFinJornada,
    restriccionHorario: raw.restriccionHorario,
    registrarBitacora: raw.registrarBitacora,
    cambioPasswordDias: raw.requerirCambioClave ? 90 : 0,
    tiempoInactividad: raw.tiempoInactividad,
    enviarRecordatorioEmail: raw.enviarRecordatorioEmail,
    notificarMedicoCitas: raw.notificarMedicoCitas,
    updatedAt: raw.updatedAt,
  };
}

export class ConfigService {
  async get(): Promise<SystemConfigResponse> {
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    if (!config) {
      throw new NotFoundError('SystemConfig');
    }
    return toResponse(config);
  }

  async update(input: UpdateConfigInput): Promise<SystemConfigResponse> {
    const { cambioPasswordDias, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (cambioPasswordDias !== undefined) data.requerirCambioClave = cambioPasswordDias > 0;

    const raw = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        nombreSistema: input.nombreSistema ?? 'Sistema de Clinica Medica',
        zonaHoraria: input.zonaHoraria ?? 'America/Costa_Rica',
        formatoFecha: input.formatoFecha ?? 'DD/MM/YYYY',
        duracionCitaDefecto: input.duracionCitaDefecto ?? 30,
        horaInicioJornada: input.horaInicioJornada ?? '08:00',
        horaFinJornada: input.horaFinJornada ?? '17:00',
        restriccionHorario: input.restriccionHorario ?? false,
        registrarBitacora: input.registrarBitacora ?? true,
        requerirCambioClave: (input.cambioPasswordDias ?? 0) > 0,
        tiempoInactividad: input.tiempoInactividad ?? 30,
        enviarRecordatorioEmail: input.enviarRecordatorioEmail ?? false,
        notificarMedicoCitas: input.notificarMedicoCitas ?? false,
      },
    });
    return toResponse(raw);
  }
}

export const configService = new ConfigService();
