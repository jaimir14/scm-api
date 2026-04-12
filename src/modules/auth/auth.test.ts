import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

// Mock database before importing routes (auth routes now use userService)
vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { authenticate } from './auth.guard';
import { authRoutes } from './auth.routes';

describe('Auth Guard', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();

    // Register a test route that uses the auth guard
    app.get('/protected', { preHandler: [authenticate] }, async () => {
      return { success: true, message: 'You are authenticated' };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access with a valid JWT token', async () => {
    const token = getTestToken(app);

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(401);
    expect(body.error).toBe('Unauthorized: Invalid or missing token');
  });

  it('should return 401 with an invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer invalid.token.here' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with malformed authorization header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'NotBearer some-token' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('Auth Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(authRoutes, { prefix: '/api/v1/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate a valid JWT token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      headers: { 'content-type': 'application/json' },
      payload: { sub: 'user-1', rolId: 1, esAdmin: true },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(typeof body.data.token).toBe('string');

    // Verify the token is actually valid by decoding it
    const decoded = app.jwt.verify(body.data.token) as { sub: string; rolId: number; esAdmin: boolean };
    expect(decoded.sub).toBe('user-1');
    expect(decoded.rolId).toBe(1);
    expect(decoded.esAdmin).toBe(true);
  });

  it('should generate token with defaults when only sub is provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      headers: { 'content-type': 'application/json' },
      payload: { sub: 'user-1' },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.data.token).toBeDefined();
  });
});
