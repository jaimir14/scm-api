import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

// Extend mock client with contrato models before importing routes
const mockContrato = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
};

const mockContratoTratamiento = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn().mockResolvedValue([]),
};

const mockContratoPago = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn().mockResolvedValue([]),
};

const mockContratoHistorial = {
  findMany: vi.fn(),
  create: vi.fn(),
};

Object.assign(mockPrismaClient, {
  contrato: mockContrato,
  contratoTratamiento: mockContratoTratamiento,
  contratoPago: mockContratoPago,
  contratoHistorial: mockContratoHistorial,
  $transaction: vi.fn(),
});

import contratoRoutes from './contrato.routes';

const baseContrato = {
  id: 'clx-route-test-001',
  numero: 'CONT-2026-0001',
  pacienteId: 1,
  dentistaId: 2,
  clinicaId: 1,
  fecha: new Date('2026-01-01').toISOString(),
  descripcion: null,
  estado: 'BORRADOR',
  moneda: 'CRC',
  plazo: null,
  periodicidad: null,
  notas: null,
  creadoPorId: 1,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  paciente: { id: 1, nombre: 'Test', apellido1: 'Patient', apellido2: null, numeroIdentificacion: '123', tipoIdentificacion: 'CEDULA' },
  dentista: { id: 2, nombre: 'Dr. Test' },
  creadoPor: { id: 1, nombre: 'Admin' },
  tratamientos: [],
  pagos: [],
  historial: [],
};

const validCreateBody = {
  pacienteId: 1,
  dentistaId: 2,
  clinicaId: 1,
  fecha: '2026-01-01',
  moneda: 'CRC',
  tratamientos: [],
};

describe('Contrato Routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(contratoRoutes, { prefix: '/api/v1' });
    await app.ready();
    token = getTestToken(app, { sub: '1', nombre: 'Admin', esAdmin: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockContratoTratamiento.aggregate.mockResolvedValue({ _sum: { subtotal: null } });
    mockContratoPago.aggregate.mockResolvedValue({ _sum: { monto: null } });
  });

  describe('POST /api/v1/contratos', () => {
    it('should return 201 with contrato numero', async () => {
      const txMock = {
        contrato: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ ...baseContrato, id: 'new-id' }),
        },
        contratoTratamiento: { create: vi.fn() },
        contratoHistorial: { create: vi.fn() },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrismaClient as any).$transaction.mockImplementation(
        (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
      );

      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, id: 'new-id' });
      mockPrismaClient.auditLog.create = vi.fn().mockResolvedValue({});

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contratos',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: validCreateBody,
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.numero).toBe('CONT-2026-0001');
    });
  });

  describe('GET /api/v1/contratos', () => {
    it('should return paginated response', async () => {
      mockContrato.findMany.mockResolvedValue([baseContrato]);
      mockContrato.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/contratos',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      if (res.statusCode !== 200) console.error("TEST ERROR:", body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.meta.total).toBe(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/contratos',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/contratos/:id', () => {
    it('should return 404 for nonexistent id', async () => {
      mockContrato.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/contratos/nonexistent-id',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });

    it('should return 200 for existing contrato', async () => {
      mockContrato.findUnique.mockResolvedValue(baseContrato);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/contratos/clx-route-test-001',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.numero).toBe('CONT-2026-0001');
    });
  });

  describe('PUT /api/v1/contratos/:id/estado', () => {
    it('should return 400 for invalid transition (COMPLETADO to ACTIVO)', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'COMPLETADO' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/contratos/clx-route-test-001/estado',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { estado: 'ACTIVO' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for invalid estado enum value', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/contratos/clx-route-test-001/estado',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { estado: 'INVALIDO' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/contratos/:id', () => {
    it('should return 400 when contrato is not in BORRADOR state', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'ACTIVO' });

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/contratos/clx-route-test-001',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 204 when contrato is in BORRADOR state', async () => {
      mockContrato.findUnique.mockResolvedValue(baseContrato);
      mockContrato.delete.mockResolvedValue(baseContrato);
      mockPrismaClient.auditLog.create = vi.fn().mockResolvedValue({});

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/contratos/clx-route-test-001',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });
  });
});
