import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { authRoutes } from './auth.routes';

describe('Auth Routes', () => {
  let app: FastifyInstance;

  const hashedPassword = bcrypt.hashSync('secret123', 10);
  const mockUser = {
    id: 1,
    usuario: 'admin',
    nombre: 'Admin User',
    password: hashedPassword,
    rolId: 1,
    rol: { id: 1, nombre: 'Administrador', esAdmin: true },
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '101010101',
    sexo: 'MASCULINO',
    especialidad: null,
    clinicaId: 1,
    estado: true,
    ultimoAcceso: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockMedicoUser = {
    id: 2,
    usuario: 'drcarlos',
    nombre: 'Dr. Carlos',
    password: hashedPassword,
    rolId: 2,
    rol: { id: 2, nombre: 'Medico', esAdmin: false },
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '202020202',
    sexo: 'MASCULINO',
    especialidad: 'Odontologia General',
    clinicaId: 1,
    estado: true,
    ultimoAcceso: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(authRoutes, { prefix: '/api/v1/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/token', () => {
    it('should generate a JWT token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/token',
        headers: { 'content-type': 'application/json' },
        payload: { sub: 'test-user', role: 'admin' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(typeof body.data.token).toBe('string');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'admin', password: 'secret123' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.usuario).toBe('admin');
      expect(body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'nonexistent', password: 'secret123' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for wrong password', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'admin', password: 'wrongpassword' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for disabled user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ ...mockUser, estado: false });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'admin', password: 'secret123' },
      });

      expect(res.statusCode).toBe(401);
    });

    it('should include especialidad and clinicaId for MEDICO users', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockMedicoUser);
      mockPrismaClient.user.update.mockResolvedValue(mockMedicoUser);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'drcarlos', password: 'secret123' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.user.especialidad).toBe('Odontologia General');
      expect(body.data.user.clinicaId).toBe(1);
    });

    it('should include null especialidad for non-MEDICO users', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'admin', password: 'secret123' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.user.especialidad).toBeNull();
      expect(body.data.user.clinicaId).toBe(1);
    });

    it('should return 400 for missing credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: { usuario: 'admin' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info from token', async () => {
      const token = getTestToken(app, { sub: '1', rol: 'Administrador' });

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(1);
      expect(body.data.rol).toBe('Administrador');
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
