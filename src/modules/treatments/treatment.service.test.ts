import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { TreatmentService } from './treatment.service';

describe('TreatmentService', () => {
  let service: TreatmentService;

  const mockTreatment = {
    id: 1,
    codigo: 'PREV-001',
    nombre: 'Limpieza Dental',
    categoria: 'PREVENTIVO',
    precio: 50000,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new TreatmentService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated treatments', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([mockTreatment]);
      mockPrismaClient.treatment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockTreatment]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by categoria', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, categoria: 'CIRUGIA' });

      expect(mockPrismaClient.treatment.findMany).toHaveBeenCalledWith({
        where: { categoria: 'CIRUGIA' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockPrismaClient.treatment.count).toHaveBeenCalledWith({
        where: { categoria: 'CIRUGIA' },
      });
    });

    it('should not filter when categoria not provided', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([]);
      mockPrismaClient.treatment.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      expect(mockPrismaClient.treatment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findActive', () => {
    it('should return only active treatments', async () => {
      mockPrismaClient.treatment.findMany.mockResolvedValue([mockTreatment]);

      const result = await service.findActive();

      expect(result).toEqual([mockTreatment]);
      expect(mockPrismaClient.treatment.findMany).toHaveBeenCalledWith({
        where: { estado: true },
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('should return treatment when found', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);

      const result = await service.findById(1);
      expect(result).toEqual(mockTreatment);
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Treatment not found');
    });
  });

  describe('create', () => {
    it('should create and return a new treatment', async () => {
      const input = { codigo: 'CIR-001', nombre: 'Extraccion', categoria: 'CIRUGIA' as const, precio: 80000, estado: true };
      mockPrismaClient.treatment.create.mockResolvedValue({ ...mockTreatment, ...input, id: 2 });

      const result = await service.create(input);
      expect(result.nombre).toBe('Extraccion');
      expect(mockPrismaClient.treatment.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update and return the treatment', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);
      mockPrismaClient.treatment.update.mockResolvedValue({ ...mockTreatment, precio: 60000 });

      const result = await service.update(1, { precio: 60000 });
      expect(result.precio).toBe(60000);
    });

    it('should throw NotFoundError when updating non-existent', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'X' })).rejects.toThrow('Treatment not found');
    });
  });

  describe('delete', () => {
    it('should delete the treatment', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(mockTreatment);
      mockPrismaClient.treatment.delete.mockResolvedValue(mockTreatment);

      await service.delete(1);
      expect(mockPrismaClient.treatment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent', async () => {
      mockPrismaClient.treatment.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Treatment not found');
    });
  });
});
