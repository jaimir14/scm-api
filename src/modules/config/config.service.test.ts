import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  const mockConfig = {
    id: 1,
    nombreSistema: 'Sistema de Clinica Medica',
    zonaHoraria: 'America/Costa_Rica',
    formatoFecha: 'DD/MM/YYYY',
    duracionCitaDefecto: 30,
    horaInicio: '08:00',
    horaFin: '17:00',
    restriccionHorario: false,
    registrarBitacora: true,
    requerirCambioClave: false,
    tiempoInactividad: 30,
    recordatorioEmail: false,
    notificarMedico: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new ConfigService();
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return config when found', async () => {
      mockPrismaClient.systemConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await service.get();

      expect(result).toEqual(mockConfig);
      expect(mockPrismaClient.systemConfig.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError when config does not exist', async () => {
      mockPrismaClient.systemConfig.findUnique.mockResolvedValue(null);

      await expect(service.get()).rejects.toThrow('SystemConfig not found');
    });
  });

  describe('update', () => {
    it('should upsert and return config', async () => {
      const input = { nombreSistema: 'Updated System' };
      mockPrismaClient.systemConfig.upsert.mockResolvedValue({ ...mockConfig, ...input });

      const result = await service.update(input);

      expect(result.nombreSistema).toBe('Updated System');
      expect(mockPrismaClient.systemConfig.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: input,
        create: expect.objectContaining({
          id: 1,
          nombreSistema: 'Updated System',
        }),
      });
    });

    it('should use defaults for create when fields not provided', async () => {
      const input = { restriccionHorario: true };
      mockPrismaClient.systemConfig.upsert.mockResolvedValue({ ...mockConfig, ...input });

      await service.update(input);

      const call = mockPrismaClient.systemConfig.upsert.mock.calls[0][0];
      expect(call.create.nombreSistema).toBe('Sistema de Clinica Medica');
      expect(call.create.zonaHoraria).toBe('America/Costa_Rica');
      expect(call.create.restriccionHorario).toBe(true);
    });
  });
});
