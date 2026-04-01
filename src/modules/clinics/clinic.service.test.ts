import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

// Mock the database module BEFORE importing the service
vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ClinicService } from './clinic.service';

describe('ClinicService', () => {
  let service: ClinicService;

  const mockClinic = {
    id: 1,
    nombre: 'Clinica Central',
    direccion: '123 Main St',
    telefono: '2222-3333',
    email: 'info@clinica.com',
    estado: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    service = new ClinicService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated clinics', async () => {
      const clinics = [mockClinic];
      mockPrismaClient.clinic.findMany.mockResolvedValue(clinics);
      mockPrismaClient.clinic.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(clinics);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaClient.clinic.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by estado when provided', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, estado: true });

      expect(mockPrismaClient.clinic.findMany).toHaveBeenCalledWith({
        where: { estado: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockPrismaClient.clinic.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty data when no clinics exist', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([]);
      mockPrismaClient.clinic.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findActive', () => {
    it('should return active clinics sorted by nombre', async () => {
      mockPrismaClient.clinic.findMany.mockResolvedValue([mockClinic]);

      const result = await service.findActive();

      expect(result).toEqual([mockClinic]);
      expect(mockPrismaClient.clinic.findMany).toHaveBeenCalledWith({
        where: { estado: true },
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('findById', () => {
    it('should return clinic when found', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);

      const result = await service.findById(1);

      expect(result).toEqual(mockClinic);
      expect(mockPrismaClient.clinic.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError when clinic does not exist', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Clinic not found');
    });
  });

  describe('create', () => {
    it('should create and return a new clinic', async () => {
      const input = {
        nombre: 'New Clinic',
        direccion: '456 Oak Ave',
        telefono: '3333-4444',
        estado: true,
      };
      mockPrismaClient.clinic.create.mockResolvedValue({ ...mockClinic, ...input, id: 2 });

      const result = await service.create(input);

      expect(result.nombre).toBe('New Clinic');
      expect(mockPrismaClient.clinic.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });

  describe('update', () => {
    it('should update and return the clinic', async () => {
      const input = { telefono: '555-9999' };
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);
      mockPrismaClient.clinic.update.mockResolvedValue({ ...mockClinic, ...input });

      const result = await service.update(1, input);

      expect(result.telefono).toBe('555-9999');
      expect(mockPrismaClient.clinic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
      });
    });

    it('should throw NotFoundError when updating non-existent clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'Updated' })).rejects.toThrow('Clinic not found');
    });
  });

  describe('delete', () => {
    it('should delete the clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(mockClinic);
      mockPrismaClient.clinic.delete.mockResolvedValue(mockClinic);

      await service.delete(1);

      expect(mockPrismaClient.clinic.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent clinic', async () => {
      mockPrismaClient.clinic.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Clinic not found');
    });
  });
});
