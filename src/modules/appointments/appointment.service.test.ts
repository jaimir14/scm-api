import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const includeRelations = {
    paciente: true,
    profesional: {
      select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
    },
    tipoCita: true,
  };

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

  beforeEach(() => {
    service = new AppointmentService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated appointments', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([mockAppointment]);
      mockPrismaClient.appointment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockAppointment]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply fecha filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, fecha: '2026-04-01' });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.fecha).toBeDefined();
      expect(call.where.fecha.gte).toBeInstanceOf(Date);
      expect(call.where.fecha.lt).toBeInstanceOf(Date);
    });

    it('should apply profesionalId filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, profesionalId: 2 });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.profesionalId).toBe(2);
    });

    it('should apply clinicaId filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, clinicaId: 3 });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.profesional).toEqual({ clinicaId: 3 });
    });

    it('should apply estado filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, estado: 'ATENDIDA' });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.estado).toBe('ATENDIDA');
    });
  });

  describe('findById', () => {
    it('should return appointment when found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.findById(1);
      expect(result).toEqual(mockAppointment);
      expect(mockPrismaClient.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: includeRelations,
      });
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Appointment not found');
    });
  });

  describe('create', () => {
    it('should create and return a new appointment', async () => {
      const input = {
        pacienteId: 1,
        profesionalId: 1,
        tipoCitaId: 1,
        fecha: new Date('2026-04-01'),
        horaInicio: '09:00',
        horaFin: '09:30',
        estado: 'PENDIENTE' as const,
      };
      mockPrismaClient.appointment.create.mockResolvedValue({ ...mockAppointment, id: 2 });

      const result = await service.create(input);
      expect(mockPrismaClient.appointment.create).toHaveBeenCalledWith({
        data: input,
        include: includeRelations,
      });
    });
  });

  describe('update', () => {
    it('should update and return the appointment', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.update.mockResolvedValue({ ...mockAppointment, horaInicio: '10:00' });

      const result = await service.update(1, { horaInicio: '10:00' });
      expect(result.horaInicio).toBe('10:00');
    });

    it('should throw NotFoundError when updating non-existent', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { horaInicio: '10:00' })).rejects.toThrow('Appointment not found');
    });
  });

  describe('updateStatus', () => {
    it('should update only the status', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.update.mockResolvedValue({ ...mockAppointment, estado: 'ATENDIDA' });

      const result = await service.updateStatus(1, { estado: 'ATENDIDA' });

      expect(result.estado).toBe('ATENDIDA');
      expect(mockPrismaClient.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'ATENDIDA' },
        include: includeRelations,
      });
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, { estado: 'CANCELADA' })).rejects.toThrow('Appointment not found');
    });
  });

  describe('delete', () => {
    it('should delete the appointment', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrismaClient.appointment.delete.mockResolvedValue(mockAppointment);

      await service.delete(1);
      expect(mockPrismaClient.appointment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Appointment not found');
    });
  });

  describe('findUpcomingToday', () => {
    it('should return upcoming appointments for today', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([mockAppointment]);

      const result = await service.findUpcomingToday(5);

      expect(result).toEqual([mockAppointment]);
      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.estado).toBe('PENDIENTE');
      expect(call.where.fecha.gte).toBeInstanceOf(Date);
      expect(call.where.fecha.lt).toBeInstanceOf(Date);
      expect(call.take).toBe(5);
      expect(call.orderBy).toEqual({ horaInicio: 'asc' });
    });
  });
});
