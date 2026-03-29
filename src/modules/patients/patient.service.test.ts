import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

// Mock the database module BEFORE importing the service
vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;

  const mockPatient = {
    id: 1,
    name: 'Maria Garcia',
    address: '123 Main St',
    phone: '305-555-1234',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new PatientService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const patients = [mockPatient];
      mockPrismaClient.patient.findMany.mockResolvedValue(patients);
      mockPrismaClient.patient.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(patients);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty data when no patients exist', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return patient when found', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);

      const result = await service.findById(1);

      expect(result).toEqual(mockPatient);
      expect(mockPrismaClient.patient.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when patient does not exist', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Patient not found');
    });
  });

  describe('create', () => {
    it('should create and return a new patient', async () => {
      const input = { name: 'New Patient', address: '456 Oak Ave', phone: '555-0000' };
      mockPrismaClient.patient.create.mockResolvedValue({ ...mockPatient, ...input, id: 2 });

      const result = await service.create(input);

      expect(result.name).toBe('New Patient');
      expect(mockPrismaClient.patient.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('update', () => {
    it('should update and return the patient', async () => {
      const input = { phone: '555-9999' };
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.update.mockResolvedValue({ ...mockPatient, ...input });

      const result = await service.update(1, input);

      expect(result.phone).toBe('555-9999');
      expect(mockPrismaClient.patient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
      });
    });

    it('should throw NotFoundError when updating non-existent patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Updated' })).rejects.toThrow('Patient not found');
    });
  });

  describe('delete', () => {
    it('should delete the patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.delete.mockResolvedValue(mockPatient);

      await service.delete(1);

      expect(mockPrismaClient.patient.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Patient not found');
    });
  });
});
