import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock Prisma before importing app
vi.mock('./database', () => ({
  prisma: {
    patient: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirstOrThrow: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

import { buildApp } from './app';
import { FastifyInstance } from 'fastify';

describe('App', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should respond to health check', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.timestamp).toBeDefined();
    expect(body.data.environment).toBeDefined();
  });

  it('should have patient routes registered', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/patients',
    });

    // Should get 401 (unauthorized) not 404 (not found)
    expect(res.statusCode).toBe(401);
  });

  it('should have auth routes registered', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      headers: { 'content-type': 'application/json' },
      payload: { sub: 'test', role: 'admin' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/unknown-route',
    });

    expect(res.statusCode).toBe(404);
  });

  it('should handle Zod validation errors with 400 status', async () => {
    // Get a valid token first
    const tokenRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      headers: { 'content-type': 'application/json' },
      payload: { sub: 'test', role: 'admin' },
    });
    const token = JSON.parse(tokenRes.body).data.token;

    // Send invalid patient data to trigger Zod error
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: { name: '', address: '', phone: '' },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation error');
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });
});
