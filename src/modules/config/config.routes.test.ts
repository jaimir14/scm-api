import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { configRoutes } from './config.routes';

describe('Config Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockConfig = {
    id: 1,
    nombreSistema: 'Sistema de Clinica Medica',
    zonaHoraria: 'America/Costa_Rica',
    formatoFecha: 'DD/MM/YYYY',
    duracionCitaDefecto: 30,
    horaInicioJornada: '08:00',
    horaFinJornada: '17:00',
    restriccionHorario: false,
    registrarBitacora: true,
    requerirCambioClave: false,
    tiempoInactividad: 30,
    enviarRecordatorioEmail: false,
    notificarMedicoCitas: false,
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(configRoutes, { prefix: '/api/v1/config' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/config', () => {
    it('should return system config', async () => {
      mockPrismaClient.systemConfig.findUnique.mockResolvedValue(mockConfig);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/config',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nombreSistema).toBe('Sistema de Clinica Medica');
    });

    it('should return 404 when config not found', async () => {
      mockPrismaClient.systemConfig.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/config',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/config' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/v1/config', () => {
    it('should update config', async () => {
      mockPrismaClient.systemConfig.upsert.mockResolvedValue({
        ...mockConfig,
        nombreSistema: 'Updated',
      });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/config',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nombreSistema: 'Updated' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.nombreSistema).toBe('Updated');
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/config',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid field values', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/config',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { duracionCitaDefecto: -5 },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
