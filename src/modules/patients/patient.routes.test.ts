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
    nombre: 'Maria',
    apellido1: 'Garcia',
    apellido2: null,
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '123456789',
    telefonoCelular: '305-555-1234',
    telefonoCasa: null,
    telefonoTrabajo: null,
    otroTelefono: null,
    sexo: 'FEMENINO',
    estadoCivil: 'SOLTERO',
    direccion: '123 Main St',
    email: null,
    ocupacion: null,
    fechaNacimiento: new Date('1990-01-01'),
    tipoSangre: null,
    clinicaId: 1,
    profesionalId: 1,
    fotografia: null,
    antecedentesPatologicos: null,
    antecedentesNoPatologicos: null,
    antecedentesQuirurgicos: null,
    antecedentesGinecoObstetricos: null,
    antecedentesHeredoFamiliares: null,
    antecedentesOtros: null,
    notas: null,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const validCreateInput = {
    nombre: 'New Patient',
    apellido1: 'Test',
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '987654321',
    telefonoCelular: '555-0000',
    sexo: 'MASCULINO',
    estadoCivil: 'SOLTERO',
    direccion: '456 Oak Ave',
    fechaNacimiento: '1985-05-15',
    clinicaId: 1,
    profesionalId: 1,
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

  describe('GET /api/v1/patients/search', () => {
    it('should search patients by name', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([mockPatient]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/search?q=Maria',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should search patients by cedula', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([mockPatient]);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/search?q=123456&type=cedula',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should return 200 with no q (browse all patients)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/patients/search',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
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
      expect(body.data.nombre).toBe('Maria');
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
      mockPrismaClient.patient.create.mockResolvedValue({ ...mockPatient, ...validCreateInput, id: 2 });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: validCreateInput,
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.nombre).toBe('New Patient');
    });

    it('should return 400 for invalid input (empty nombre)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
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
        url: '/api/v1/patients',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { nombre: 'Test' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/patients/:id', () => {
    it('should update a patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.update.mockResolvedValue({ ...mockPatient, telefonoCelular: '555-9999' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/patients/1',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        payload: { telefonoCelular: '555-9999' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.telefonoCelular).toBe('555-9999');
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
