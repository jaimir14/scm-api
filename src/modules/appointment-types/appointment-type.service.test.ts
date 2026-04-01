import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { AppointmentTypeService } from './appointment-type.service';

describe('AppointmentTypeService', () => {
  let service: AppointmentTypeService;

  const mockType = {
    id: 1,
    nombre: 'Consulta General',
    duracion: 30,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new AppointmentTypeService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated appointment types', async () => {
      mockPrismaClient.appointmentType.findMany.mockResolvedValue([mockType]);
      mockPrismaClient.appointmentType.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockType]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockPrismaClient.appointmentType.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty data when none exist', async () => {
      mockPrismaClient.appointmentType.findMany.mockResolvedValue([]);
      mockPrismaClient.appointmentType.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findActive', () => {
    it('should return active types sorted by nombre', async () => {
      mockPrismaClient.appointmentType.findMany.mockResolvedValue([mockType]);

      const result = await service.findActive();

      expect(result).toEqual([mockType]);
      expect(mockPrismaClient.appointmentType.findMany).toHaveBeenCalledWith({
        where: { estado: true },
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('should return type when found', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);

      const result = await service.findById(1);
      expect(result).toEqual(mockType);
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('AppointmentType not found');
    });
  });

  describe('create', () => {
    it('should create and return a new type', async () => {
      const input = { nombre: 'Limpieza', duracion: 45, estado: true };
      mockPrismaClient.appointmentType.create.mockResolvedValue({ ...mockType, ...input, id: 2 });

      const result = await service.create(input);
      expect(result.nombre).toBe('Limpieza');
      expect(mockPrismaClient.appointmentType.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update and return the type', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);
      mockPrismaClient.appointmentType.update.mockResolvedValue({ ...mockType, duracion: 60 });

      const result = await service.update(1, { duracion: 60 });
      expect(result.duracion).toBe(60);
    });

    it('should throw NotFoundError when updating non-existent', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'X' })).rejects.toThrow('AppointmentType not found');
    });
  });

  describe('delete', () => {
    it('should delete the type', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(mockType);
      mockPrismaClient.appointmentType.delete.mockResolvedValue(mockType);

      await service.delete(1);
      expect(mockPrismaClient.appointmentType.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent', async () => {
      mockPrismaClient.appointmentType.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('AppointmentType not found');
    });
  });
});
