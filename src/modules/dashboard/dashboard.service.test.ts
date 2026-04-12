import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    vi.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      mockPrismaClient.appointment.count.mockResolvedValue(5);
      mockPrismaClient.patient.count
        .mockResolvedValueOnce(100) // total patients
        .mockResolvedValueOnce(90); // active patients (estado: true)
      mockPrismaClient.clinic.count.mockResolvedValue(3);

      const result = await service.getStats();

      expect(result).toEqual({
        citasHoy: 5,
        pacientes: 100,
        expedientes: 90,
        clinicas: 3,
      });
    });

    it('should return zeros when no data', async () => {
      mockPrismaClient.appointment.count.mockResolvedValue(0);
      mockPrismaClient.patient.count.mockResolvedValue(0);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.citasHoy).toBe(0);
      expect(result.pacientes).toBe(0);
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should return upcoming appointments', async () => {
      const mockAppointment = {
        id: 1,
        horaInicio: '09:00',
        estado: 'PENDIENTE',
      };
      mockPrismaClient.appointment.findMany.mockResolvedValue([mockAppointment]);

      const result = await service.getUpcomingAppointments();

      expect(result).toEqual([mockAppointment]);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent audit log entries', async () => {
      const mockLog = { id: 1, accion: 'CREACION', fecha: new Date('2026-04-11T12:00:00Z') };
      mockPrismaClient.auditLog.findMany.mockResolvedValue([mockLog]);

      const result = await service.getRecentActivity();

      expect(result[0]).toMatchObject({ id: 1, accion: 'CREACION' });
      expect(result[0]).toHaveProperty('fechaFormateada');
      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { fecha: 'desc' },
        take: 10,
      });
    });
  });
});
