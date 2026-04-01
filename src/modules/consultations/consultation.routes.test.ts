import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { consultationRoutes, patientConsultationRoutes } from './consultation.routes';

describe('Consultation Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockConsultation = {
    id: 1,
    pacienteId: 1,
    profesionalId: 1,
    fecha: new Date('2026-03-15'),
    ocultar: false,
    peso: 70,
    talla: 170,
    imc: null,
    temperatura: null,
    presionArterial: '120/80',
    frecuenciaCardiaca: null,
    frecuenciaRespiratoria: null,
    satO2: null,
    motivoConsulta: 'Dolor',
    examenFisico: null,
    impresionDiagnostica: null,
    indicacionesTratamientos: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    paciente: { id: 1, nombre: 'Maria' },
    profesional: { id: 1, nombre: 'Dr. Carlos' },
  };

  const validCreateInput = {
    pacienteId: 1,
    profesionalId: 1,
    fecha: '2026-03-15',
    peso: 70,
    motivoConsulta: 'Control general',
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(consultationRoutes, { prefix: '/api/v1/consultations' });
    app.register(patientConsultationRoutes, { prefix: '/api/v1/patients/:patientId/consultations' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/consultations', () => {
    it('should return paginated consultations', async () => {
      mockPrismaClient.consultation.findMany.mockResolvedValue([mockConsultation]);
      mockPrismaClient.consultation.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/consultations',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/consultations' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/consultations/:id', () => {
    it('should return a single consultation', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/consultations/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.motivoConsulta).toBe('Dolor');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/consultations/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/consultations', () => {
    it('should create and return 201', async () => {
      mockPrismaClient.consultation.create.mockResolvedValue(mockConsultation);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/consultations',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validCreateInput,
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/consultations',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { pacienteId: 1 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/consultations/:id', () => {
    it('should update a consultation', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);
      mockPrismaClient.consultation.update.mockResolvedValue({ ...mockConsultation, peso: 75 });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/consultations/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { peso: 75 },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.peso).toBe(75);
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/consultations/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/consultations/:id', () => {
    it('should delete and return 204', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);
      mockPrismaClient.consultation.delete.mockResolvedValue(mockConsultation);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/consultations/1',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/consultations/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/patients/:patientId/consultations', () => {
    it('should return consultations for a patient', async () => {
      mockPrismaClient.consultation.findMany.mockResolvedValue([mockConsultation]);
      mockPrismaClient.consultation.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/1/consultations',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/1/consultations',
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
