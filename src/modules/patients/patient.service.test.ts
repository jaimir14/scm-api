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
    nombre: 'Maria',
    apellido1: 'Garcia',
    apellido2: null,
    tipoIdentificacion: 'CEDULA',
    numeroIdentificacion: '123456789',
    telefonoCelular: '305-555-1234',
    telefonoCasa: null,
    telefonoTrabajo: null,
    otroTelefono: null,
    sexo: 'FEMENINO',
    estadoCivil: 'SOLTERO',
    direccion: '123 Main St',
    email: null,
    ocupacion: null,
    fechaNacimiento: new Date('1990-01-01'),
    tipoSangre: null,
    clinicaId: 1,
    profesionalId: 1,
    fotografia: null,
    antecedentesPatologicos: null,
    antecedentesNoPatologicos: null,
    antecedentesQuirurgicos: null,
    antecedentesGinecoObstetricos: null,
    antecedentesHeredoFamiliares: null,
    otrosAntecedentes: null,
    notas: null,
    estado: true,
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

      const result = await service.findAll({ page: 1, limit: 20, q: '', type: 'nombre' });

      expect(result.data).toEqual(patients);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10, q: '', type: 'nombre' });

      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty data when no patients exist', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([]);
      mockPrismaClient.patient.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20, q: '', type: 'nombre' });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('search', () => {
    it('should search patients by nombre', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([mockPatient]);
      mockPrismaClient.patient.count.mockResolvedValue(1);

      const result = await service.search({ q: 'Maria', type: 'nombre', page: 1, limit: 25 });

      expect(result.data).toEqual([mockPatient]);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { nombre: { contains: 'Maria' } },
              { apellido1: { contains: 'Maria' } },
              { apellido2: { contains: 'Maria' } },
            ],
          }),
        }),
      );
    });

    it('should search patients by cedula', async () => {
      mockPrismaClient.patient.findMany.mockResolvedValue([mockPatient]);
      mockPrismaClient.patient.count.mockResolvedValue(1);

      const result = await service.search({ q: '123456', type: 'cedula', page: 1, limit: 25 });

      expect(result.data).toEqual([mockPatient]);
      expect(mockPrismaClient.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            numeroIdentificacion: { contains: '123456' },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return patient when found', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);

      const result = await service.findById(1);

      expect(result).toEqual(mockPatient);
      expect(mockPrismaClient.patient.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { clinica: true, profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } } },
      });
    });

    it('should throw NotFoundError when patient does not exist', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Patient not found');
    });
  });

  describe('create', () => {
    it('should create and return a new patient', async () => {
      const input = {
        nombre: 'New Patient',
        apellido1: 'Test',
        tipoIdentificacion: 'CEDULA' as const,
        numeroIdentificacion: '987654321',
        telefonoCelular: '555-0000',
        sexo: 'MASCULINO' as const,
        estadoCivil: 'SOLTERO' as const,
        direccion: '456 Oak Ave',
        fechaNacimiento: new Date('1985-05-15'),
        clinicaId: 1,
        profesionalId: 1,
        estado: true,
      };
      mockPrismaClient.patient.create.mockResolvedValue({ ...mockPatient, ...input, id: 2 });

      const result = await service.create(input);

      expect(result.nombre).toBe('New Patient');
      expect(mockPrismaClient.patient.create).toHaveBeenCalledWith({
        data: input,
        include: { clinica: true, profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } } },
      });
    });
  });

  describe('update', () => {
    it('should update and return the patient', async () => {
      const input = { telefonoCelular: '555-9999' };
      mockPrismaClient.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaClient.patient.update.mockResolvedValue({ ...mockPatient, ...input });

      const result = await service.update(1, input);

      expect(result.telefonoCelular).toBe('555-9999');
      expect(mockPrismaClient.patient.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: input,
        include: { clinica: true, profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } } },
      });
    });

    it('should throw NotFoundError when updating non-existent patient', async () => {
      mockPrismaClient.patient.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nombre: 'Updated' })).rejects.toThrow('Patient not found');
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
