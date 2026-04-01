import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { auditLogRoutes } from './audit-log.routes';

describe('Audit Log Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockLog = {
    id: 1,
    fecha: new Date('2026-03-15'),
    usuarioId: 1,
    modulo: 'patients',
    accion: 'CREACION',
    descripcion: 'Created patient',
    createdAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(auditLogRoutes, { prefix: '/api/v1/audit-log' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/audit-log', () => {
    it('should return paginated audit logs', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([mockLog]);
      mockPrismaClient.auditLog.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-log',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta.total).toBe(1);
    });

    it('should support filter query params', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-log?fechaDesde=2026-01-01&accion=CREACION&modulo=patients',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/audit-log' });
      expect(res.statusCode).toBe(401);
    });
  });
});
