import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { appointmentTypeRoutes } from './appointment-type.routes';

describe('AppointmentType Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockType = {
    id: 1,
    nombre: 'Consulta General',
    duracion: 30,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(appointmentTypeRoutes, { prefix: '/api/v1/appointment-types' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/appointment-types', () => {
    it('should return paginated types', async () => {
      mockPrismaClient.appointmentType.findMany.mockResolvedValue([mockType]);
      mockPrismaClient.appointmentType.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointment-types',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/appointment-types' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/appointment-types/active', () => {
    it('should return active types', async () => {
      mockPrismaClient.appointmentType.findMany.mockResolvedValue([mockType]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointment-types/active',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/appointment-types/:id', () => {
    it('should return a single type', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointment-types/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.nombre).toBe('Consulta General');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointment-types/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/appointment-types', () => {
    it('should create and return 201', async () => {
      mockPrismaClient.appointmentType.create.mockResolvedValue({ ...mockType, id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/appointment-types',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nombre: 'Consulta General', duracion: 30 },
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 400 for missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/appointment-types',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nombre: 'Test' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/appointment-types/:id', () => {
    it('should update a type', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);
      mockPrismaClient.appointmentType.update.mockResolvedValue({ ...mockType, duracion: 60 });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointment-types/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { duracion: 60 },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.duracion).toBe(60);
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointment-types/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/appointment-types/:id', () => {
    it('should delete and return 204', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);
      mockPrismaClient.appointmentType.delete.mockResolvedValue(mockType);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/appointment-types/1',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/appointment-types/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
