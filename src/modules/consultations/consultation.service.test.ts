import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ConsultationService } from './consultation.service';

describe('ConsultationService', () => {
  let service: ConsultationService;

  const includeRelations = {
    paciente: true,
    profesional: {
      select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
    },
  };

  const mockConsultation = {
    id: 1,
    pacienteId: 1,
    profesionalId: 1,
    fecha: new Date('2026-03-15'),
    ocultar: false,
    peso: 70,
    talla: 170,
    imc: null,
    temperatura: null,
    presionArterial: '120/80',
    frecuenciaCardiaca: null,
    frecuenciaRespiratoria: null,
    satO2: null,
    motivoConsulta: 'Dolor',
    examenFisico: null,
    impresionDiagnostica: null,
    indicacionesTratamientos: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    paciente: { id: 1, nombre: 'Maria' },
    profesional: { id: 1, nombre: 'Dr. Carlos' },
  };

  beforeEach(() => {
    service = new ConsultationService();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated consultations', async () => {
      mockPrismaClient.consultation.findMany.mockResolvedValue([mockConsultation]);
      mockPrismaClient.consultation.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockConsultation]);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(mockPrismaClient.consultation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, orderBy: { fecha: 'desc' } }),
      );
    });

    it('should return empty when none exist', async () => {
      mockPrismaClient.consultation.findMany.mockResolvedValue([]);
      mockPrismaClient.consultation.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findByPatient', () => {
    it('should return consultations for a specific patient', async () => {
      mockPrismaClient.consultation.findMany.mockResolvedValue([mockConsultation]);
      mockPrismaClient.consultation.count.mockResolvedValue(1);

      const result = await service.findByPatient(1, { page: 1, limit: 20 });

      expect(result.data).toEqual([mockConsultation]);
      expect(mockPrismaClient.consultation.findMany).toHaveBeenCalledWith({
        where: { pacienteId: 1 },
        skip: 0,
        take: 20,
        orderBy: { fecha: 'desc' },
        include: includeRelations,
      });
      expect(mockPrismaClient.consultation.count).toHaveBeenCalledWith({
        where: { pacienteId: 1 },
      });
    });
  });

  describe('findById', () => {
    it('should return consultation when found', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);

      const result = await service.findById(1);
      expect(result).toEqual(mockConsultation);
      expect(mockPrismaClient.consultation.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: includeRelations,
      });
    });

    it('should throw NotFoundError when not found', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow('Consultation not found');
    });
  });

  describe('create', () => {
    it('should create and return a new consultation', async () => {
      const input = {
        pacienteId: 1,
        profesionalId: 1,
        citaId: 10,
        fecha: new Date('2026-03-20'),
        ocultar: false,
        peso: 70,
        motivoConsulta: 'Dolor de cabeza',
      };
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);
      mockPrismaClient.consultation.create.mockResolvedValue({ ...mockConsultation, ...input, id: 2 });

      const result = await service.create(input);
      expect(mockPrismaClient.consultation.create).toHaveBeenCalledWith({
        data: input,
        include: includeRelations,
      });
    });

    it('should create consultation without citaId', async () => {
      const input = {
        pacienteId: 1,
        profesionalId: 1,
        fecha: new Date('2026-03-20'),
        ocultar: false,
        peso: 70,
        motivoConsulta: 'Dolor de cabeza',
      };
      mockPrismaClient.consultation.create.mockResolvedValue({ ...mockConsultation, ...input, id: 2 });

      const result = await service.create(input);
      expect(mockPrismaClient.consultation.create).toHaveBeenCalledWith({
        data: input,
        include: includeRelations,
      });
    });

    it('should throw if a consultation already exists for the same appointment', async () => {
      const input = {
        pacienteId: 1,
        profesionalId: 1,
        citaId: 10,
        fecha: new Date('2026-03-20'),
        ocultar: false,
        peso: 70,
        motivoConsulta: 'Dolor de cabeza',
      };
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);

      await expect(service.create(input)).rejects.toThrow('Ya existe una consulta para esta cita');
    });
  });

  describe('update', () => {
    it('should update and return the consultation', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);
      mockPrismaClient.consultation.update.mockResolvedValue({ ...mockConsultation, peso: 75 });

      const result = await service.update(1, { peso: 75 });
      expect(result.peso).toBe(75);
      expect(mockPrismaClient.consultation.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { peso: 75 },
        include: includeRelations,
      });
    });

    it('should throw NotFoundError when updating non-existent', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { peso: 75 })).rejects.toThrow('Consultation not found');
    });
  });

  describe('delete', () => {
    it('should delete the consultation', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(mockConsultation);
      mockPrismaClient.consultation.delete.mockResolvedValue(mockConsultation);

      await service.delete(1);
      expect(mockPrismaClient.consultation.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when deleting non-existent', async () => {
      mockPrismaClient.consultation.findUnique.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow('Consultation not found');
    });
  });
});
