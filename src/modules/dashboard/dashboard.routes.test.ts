import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { dashboardRoutes } from './dashboard.routes';

describe('Dashboard Routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/stats', () => {
    it('should return stats', async () => {
      mockPrismaClient.appointment.count.mockResolvedValue(5);
      mockPrismaClient.patient.count.mockResolvedValue(100);
      mockPrismaClient.clinic.count.mockResolvedValue(3);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/stats',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('citasHoy');
      expect(body.data).toHaveProperty('pacientes');
      expect(body.data).toHaveProperty('expedientes');
      expect(body.data).toHaveProperty('clinicas');
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/dashboard/stats' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/dashboard/upcoming-appointments', () => {
    it('should return upcoming appointments', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/upcoming-appointments',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/dashboard/recent-activity', () => {
    it('should return recent activity', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/recent-activity',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
