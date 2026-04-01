import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp, getTestToken } from '../../../tests/helpers/build-test-app';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { appointmentRoutes } from './appointment.routes';

describe('Appointment Routes', () => {
  let app: FastifyInstance;
  let token: string;

  const mockAppointment = {
    id: 1,
    pacienteId: 1,
    profesionalId: 1,
    tipoCitaId: 1,
    fecha: new Date('2026-04-01'),
    horaInicio: '09:00',
    horaFin: '09:30',
    notas: null,
    estado: 'PENDIENTE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    paciente: { id: 1, nombre: 'Maria' },
    profesional: { id: 1, nombre: 'Dr. Carlos' },
    tipoCita: { id: 1, nombre: 'Consulta General' },
  };

  const validCreateInput = {
    pacienteId: 1,
    profesionalId: 1,
    tipoCitaId: 1,
    fecha: '2026-04-01',
    horaInicio: '09:00',
    horaFin: '09:30',
  };

  beforeAll(async () => {
    app = await buildTestApp();
    app.register(appointmentRoutes, { prefix: '/api/v1/appointments' });
    await app.ready();
    token = getTestToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/appointments', () => {
    it('should return paginated appointments', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([mockAppointment]);
      mockPrismaClient.appointment.count.mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointments',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/appointments' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/appointments/:id', () => {
    it('should return a single appointment', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointments/1',
        headers: { authorization: `Bearer ${token}` },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.horaInicio).toBe('09:00');
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/appointments/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('should create and return 201', async () => {
      mockPrismaClient.appointment.create.mockResolvedValue(mockAppointment);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/appointments',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: validCreateInput,
      });

      expect(res.statusCode).toBe(201);
    });

    it('should return 400 for missing fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/appointments',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { pacienteId: 1 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/appointments/:id', () => {
    it('should update an appointment', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.update.mockResolvedValue({ ...mockAppointment, horaInicio: '10:00' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointments/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { horaInicio: '10:00' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.horaInicio).toBe('10:00');
    });

    it('should return 400 when no fields provided', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointments/1',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.update.mockResolvedValue({ ...mockAppointment, estado: 'ATENDIDA' });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointments/1/status',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { estado: 'ATENDIDA' },
      });

      const body = JSON.parse(res.body);
      expect(res.statusCode).toBe(200);
      expect(body.data.estado).toBe('ATENDIDA');
    });

    it('should return 400 for invalid status', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointments/1/status',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { estado: 'INVALID' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when appointment not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/appointments/999/status',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: { estado: 'CANCELADA' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/appointments/:id', () => {
    it('should delete and return 204', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.delete.mockResolvedValue(mockAppointment);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/appointments/1',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(204);
    });

    it('should return 404 when not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/appointments/999',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
