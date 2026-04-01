import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
    vi.clearAllMocks();
  });

  describe('appointmentReport', () => {
    it('should return appointments without filters', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      const result = await service.appointmentReport({});

      expect(result).toEqual({ data: [], count: 0 });
      expect(mockPrismaClient.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }],
        include: {
          paciente: true,
          profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } },
          tipoCita: true,
        },
      });
    });

    it('should apply date range filters', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.appointmentReport({ desde: '2026-01-01', hasta: '2026-12-31' });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.fecha.gte).toBeInstanceOf(Date);
      expect(call.where.fecha.lt).toBeInstanceOf(Date);
    });

    it('should apply profesionalId filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.appointmentReport({ profesionalId: 1 });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.profesionalId).toBe(1);
    });

    it('should apply clinicaId filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.appointmentReport({ clinicaId: 2 });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.profesional).toEqual({ clinicaId: 2 });
    });

    it('should apply estado filter', async () => {
      mockPrismaClient.appointment.findMany.mockResolvedValue([]);
      mockPrismaClient.appointment.count.mockResolvedValue(0);

      await service.appointmentReport({ estado: 'CANCELADA' });

      const call = mockPrismaClient.appointment.findMany.mock.calls[0][0];
      expect(call.where.estado).toBe('CANCELADA');
    });
  });

  describe('patientReport', () => {
    it('should return patients without filters', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      const result = await service.patientReport({});

      expect(result).toEqual({ data: [], count: 0 });
    });

    it('should apply clinicaId filter', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      await service.patientReport({ clinicaId: 1 });

      const call = mockPrismaClient.patient.findMany.mock.calls[0][0];
      expect(call.where.clinicaId).toBe(1);
    });

    it('should apply sexo filter', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      await service.patientReport({ sexo: 'FEMENINO' });

      const call = mockPrismaClient.patient.findMany.mock.calls[0][0];
      expect(call.where.sexo).toBe('FEMENINO');
    });
  });

  describe('clinicReport', () => {
    it('should return clinics without filters', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      const result = await service.clinicReport({});
      expect(result).toEqual({ data: [], count: 0 });
    });

    it('should apply estado filter', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      await service.clinicReport({ estado: true });

      const call = mockPrismaClient.clinic.findMany.mock.calls[0][0];
      expect(call.where.estado).toBe(true);
    });
  });

  describe('treatmentReport', () => {
    it('should return treatments without filters', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      const result = await service.treatmentReport({});
      expect(result).toEqual({ data: [], count: 0 });
    });

    it('should apply categoria filter', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      await service.treatmentReport({ categoria: 'ORTODONCIA' });

      const call = mockPrismaClient.treatment.findMany.mock.calls[0][0];
      expect(call.where.categoria).toBe('ORTODONCIA');
    });
  });

  describe('userReport', () => {
    it('should return users without filters (no password in select)', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      const result = await service.userReport({});

      expect(result).toEqual({ data: [], count: 0 });
      const call = mockPrismaClient.user.findMany.mock.calls[0][0];
      expect(call.select).not.toHaveProperty('password');
    });

    it('should apply rol filter', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      await service.userReport({ rol: 'ADMINISTRADOR' });

      const call = mockPrismaClient.user.findMany.mock.calls[0][0];
      expect(call.where.rol).toBe('ADMINISTRADOR');
    });

    it('should apply estado filter', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      await service.userReport({ estado: false });

      const call = mockPrismaClient.user.findMany.mock.calls[0][0];
      expect(call.where.estado).toBe(false);
    });
  });
});
