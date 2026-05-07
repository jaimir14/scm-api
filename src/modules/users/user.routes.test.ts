import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { userRoutes } from './user.routes';

describe('User Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockUser = {
    id: 1,
    usuario: 'jdoe',
    nombre: 'John Doe',
    passwordHash: '$2a$10$hashedpassword',
    rolId: 1,
    rol: { id: 1, nombre: 'Administrador', esAdmin: true },
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '123456789',
    sexo: 'MASCULINO',
    clinicaId: 1,
    estado: true,
    ultimoAcceso: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const validCreateInput = {
    usuario: 'newuser',
    nombre: 'New User',
    password: 'secret123',
    rolId: 2,
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '987654321',
    sexo: 'MASCULINO',
    clinicaId: 1,
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users without password', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockUser]);
      mockPrismaClient.user.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users?page=1&limit=10',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return a single user without password', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.usuario).toBe('jdoe');
      expect(body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a user and return 201 without password', async () => {
      mockPrismaClient.user.create.mockResolvedValue({ ...mockUser, usuario: 'newuser', id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validCreateInput,
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { usuario: 'test' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid rolId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { ...validCreateInput, rolId: 0 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update a user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue({ ...mockUser, nombre: 'Updated' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { nombre: 'Updated' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete and return 204', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.delete.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users/1',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when deleting non-existent', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
