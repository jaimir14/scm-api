import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { professionalRoutes } from './professional.routes';

describe('Professional Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockProfessional = {
    id: 1,
    nombre: 'Dr. Carlos',
    especialidad: 'Odontologia General',
    clinicaId: 1,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    clinica: { id: 1, nombre: 'Clinica Central' },
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(professionalRoutes, { prefix: '/api/v1/professionals' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/professionals', () => {
    it('should return paginated professionals', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockProfessional]);
      mockPrismaClient.user.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/professionals?page=1&limit=10',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta.total).toBe(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/professionals',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/professionals/active', () => {
    it('should return active professionals', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockProfessional]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/professionals/active',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/professionals/:id', () => {
    it('should return a single professional', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockProfessional);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/professionals/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('Dr. Carlos');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/professionals/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
