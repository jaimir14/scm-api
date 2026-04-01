import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { treatmentRoutes } from './treatment.routes';

describe('Treatment Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockTreatment = {
    id: 1,
    codigo: 'PREV-001',
    nombre: 'Limpieza Dental',
    categoria: 'PREVENTIVO',
    precio: 50000,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const validCreateInput = {
    codigo: 'PREV-001',
    nombre: 'Limpieza Dental',
    categoria: 'PREVENTIVO',
    precio: 50000,
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(treatmentRoutes, { prefix: '/api/v1/treatments' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/treatments', () => {
    it('should return paginated treatments', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([mockTreatment]);
      mockPrismaClient.treatment.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/treatments',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/treatments' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/treatments/active', () => {
    it('should return active treatments', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([mockTreatment]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/treatments/active',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/treatments/:id', () => {
    it('should return a single treatment', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/treatments/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.nombre).toBe('Limpieza Dental');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/treatments/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/treatments', () => {
    it('should create and return 201', async () => {
      mockPrismaClient.treatment.create.mockResolvedValue({ ...mockTreatment, id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/treatments',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validCreateInput,
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 400 for missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/treatments',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nombre: 'Test' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/treatments/:id', () => {
    it('should update a treatment', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);
      mockPrismaClient.treatment.update.mockResolvedValue({ ...mockTreatment, precio: 75000 });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/treatments/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { precio: 75000 },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.precio).toBe(75000);
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/treatments/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/treatments/:id', () => {
    it('should delete and return 204', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);
      mockPrismaClient.treatment.delete.mockResolvedValue(mockTreatment);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/treatments/1',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/treatments/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
