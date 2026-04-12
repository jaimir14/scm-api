import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ProfessionalService } from './professional.service';

describe('ProfessionalService', () => {
  let service: ProfessionalService;

  const mockProfessional = {
    id: 1,
    nombre: 'Dr. Carlos Rodriguez',
    especialidad: 'Odontologia General',
    clinicaId: 1,
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    clinica: { id: 1, nombre: 'Clinica Central' },
  };

  beforeEach(() => {
    service = new ProfessionalService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated professionals (MEDICO users)', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockProfessional]);
      mockPrismaClient.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockProfessional]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { especialidad: { not: null } },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty data when none exist', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findActive', () => {
    it('should return active MEDICO users sorted by nombre', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([mockProfessional]);

      const result = await service.findActive();

      expect(result).toEqual([mockProfessional]);
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { especialidad: { not: null }, estado: true },
          orderBy: { nombre: 'asc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return professional when found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockProfessional);

      const result = await service.findById(1);

      expect(result).toEqual(mockProfessional);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Professional not found');
    });
  });
});
