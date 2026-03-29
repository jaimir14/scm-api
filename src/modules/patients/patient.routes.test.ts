import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

// Mock database before importing routes
vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { patientRoutes } from './patient.routes';

describe('Patient Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockPatient = {
    id: 1,
    name: 'Maria Garcia',
    address: '123 Main St',
    phone: '305-555-1234',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(patientRoutes, { prefix: '/api/v1/patients' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/patients', () => {
    it('should return paginated patients', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([mockPatient]);
      mockPrismaClient.patient.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients?page=1&limit=10',
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
        url: '/api/v1/patients',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/patients/:id', () => {
    it('should return a single patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Maria Garcia');
    });

    it('should return 404 when patient not found', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/999',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/patients', () => {
    it('should create a patient and return 201', async () => {
      const input = { name: 'New Patient', address: '456 Oak Ave', phone: '555-0000' };
      mockPrismaClient.patient.create.mockResolvedValue({ ...mockPatient, ...input, id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: input,
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Patient');
    });

    it('should return 400 for invalid input (empty name)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { name: '', address: '123 St', phone: '555-1234' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { name: 'Test' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/patients/:id', () => {
    it('should update a patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.update.mockResolvedValue({ ...mockPatient, phone: '555-9999' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/patients/1',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { phone: '555-9999' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.phone).toBe('555-9999');
    });

    it('should return 400 when no fields provided for update', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/patients/1',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/patients/:id', () => {
    it('should delete a patient and return 204', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.delete.mockResolvedValue(mockPatient);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/patients/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when deleting non-existent patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/patients/999',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
