import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  const mockLog = {
    id: 1,
    fecha: new Date('2026-03-15'),
    usuarioId: 1,
    modulo: 'patients',
    accion: 'CREACION',
    descripcion: 'Created patient',
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new AuditLogService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([mockLog]);
      mockPrismaClient.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data[0]).toMatchObject(mockLog);
      expect(result.data[0]).toHaveProperty('fechaFormateada');
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should apply fechaDesde filter', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, fechaDesde: '2026-01-01' });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.fecha.gte).toBeInstanceOf(Date);
    });

    it('should apply fechaHasta filter', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, fechaHasta: '2026-12-31' });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.fecha.lt).toBeInstanceOf(Date);
    });

    it('should apply usuarioId filter', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, usuarioId: 1 });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.usuarioId).toBe(1);
    });

    it('should apply modulo filter', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, modulo: 'patients' });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.modulo).toBe('patients');
    });

    it('should apply accion filter', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, accion: 'CREACION' });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.accion).toBe('CREACION');
    });

    it('should not set fecha filter when neither fechaDesde nor fechaHasta provided', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);
      mockPrismaClient.auditLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      const call = mockPrismaClient.auditLog.findMany.mock.calls[0][0];
      expect(call.where.fecha).toBeUndefined();
    });
  });

  describe('findRecent', () => {
    it('should return recent audit logs', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([mockLog]);

      const result = await service.findRecent(10);

      expect(result[0]).toMatchObject(mockLog);
      expect(result[0]).toHaveProperty('fechaFormateada');
      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { fecha: 'desc' },
        take: 10,
      });
    });

    it('should default to 10 items', async () => {
      mockPrismaClient.auditLog.findMany.mockResolvedValue([]);

      await service.findRecent();

      expect(mockPrismaClient.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { fecha: 'desc' },
        take: 10,
      });
    });
  });
});
