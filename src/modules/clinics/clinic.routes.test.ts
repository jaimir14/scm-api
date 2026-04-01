import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

// Mock database before importing routes
vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { clinicRoutes } from './clinic.routes';

describe('Clinic Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockClinic = {
    id: 1,
    nombre: 'Clinica Central',
    direccion: '123 Main St',
    telefono: '2222-3333',
    email: 'info@clinica.com',
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const validCreateInput = {
    nombre: 'New Clinic',
    direccion: '456 Oak Ave',
    telefono: '3333-4444',
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(clinicRoutes, { prefix: '/api/v1/clinics' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/clinics', () => {
    it('should return paginated clinics', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([mockClinic]);
      mockPrismaClient.clinic.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/clinics?page=1&limit=10',
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
        url: '/api/v1/clinics',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/clinics/active', () => {
    it('should return active clinics', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([mockClinic]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/clinics/active',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/clinics/:id', () => {
    it('should return a single clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/clinics/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('Clinica Central');
    });

    it('should return 404 when clinic not found', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/clinics/999',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/clinics', () => {
    it('should create a clinic and return 201', async () => {
      mockPrismaClient.clinic.create.mockResolvedValue({ ...mockClinic, ...validCreateInput, id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/clinics',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: validCreateInput,
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('New Clinic');
    });

    it('should return 400 for invalid input (empty nombre)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/clinics',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { ...validCreateInput, nombre: '' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/clinics',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { nombre: 'Test' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/clinics/:id', () => {
    it('should update a clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);
      mockPrismaClient.clinic.update.mockResolvedValue({ ...mockClinic, telefono: '555-9999' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/clinics/1',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { telefono: '555-9999' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.telefono).toBe('555-9999');
    });

    it('should return 400 when no fields provided for update', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/clinics/1',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/clinics/:id', () => {
    it('should delete a clinic and return 204', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);
      mockPrismaClient.clinic.delete.mockResolvedValue(mockClinic);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/clinics/1',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when deleting non-existent clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/clinics/999',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
