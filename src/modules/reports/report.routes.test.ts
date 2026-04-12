import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { reportRoutes } from './report.routes';

describe('Report Routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(reportRoutes, { prefix: '/api/v1/reports' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/reports/appointments', () => {
    it('should return appointment report', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/appointments',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.count).toBe(0);
    });

    it('should support filters', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/appointments?desde=2026-01-01&estado=PENDIENTE',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/reports/appointments' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/reports/patients', () => {
    it('should return patient report', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/patients',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should support filters', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/patients?sexo=FEMENINO&clinicaId=1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/reports/clinics', () => {
    it('should return clinic report', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/clinics',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('GET /api/v1/reports/treatments', () => {
    it('should return treatment report', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/treatments',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should support categoria filter', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/treatments?categoria=CIRUGIA',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/reports/users', () => {
    it('should return user report', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/users',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should support filters', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/users?rolId=2&estado=true',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
