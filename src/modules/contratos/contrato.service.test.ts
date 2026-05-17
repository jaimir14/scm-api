import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient } from '../../../tests/helpers/mock-prisma';

vi.mock('../../database', () => ({
  prisma: mockPrismaClient,
}));

import { ContratoService } from './contrato.service';

// Extend mock client with contrato models
const mockContrato = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
};

const mockContratoTratamiento = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn().mockResolvedValue([]),
};

const mockContratoPago = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn().mockResolvedValue([]),
};

const mockContratoHistorial = {
  findMany: vi.fn(),
  create: vi.fn(),
};

Object.assign(mockPrismaClient, {
  contrato: mockContrato,
  contratoTratamiento: mockContratoTratamiento,
  contratoPago: mockContratoPago,
  contratoHistorial: mockContratoHistorial,
  $transaction: vi.fn(),
});

const baseContrato = {
  id: 'clx-test-id-001',
  numero: 'CONT-2026-0001',
  pacienteId: 1,
  dentistaId: 2,
  clinicaId: 1,
  fecha: new Date('2026-01-01'),
  descripcion: null,
  estado: 'BORRADOR',
  moneda: 'CRC',
  plazo: null,
  periodicidad: null,
  notas: null,
  creadoPorId: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  paciente: { id: 1, nombre: 'Test', apellido1: 'Patient', apellido2: null, numeroIdentificacion: '123', tipoIdentificacion: 'CEDULA' },
  dentista: { id: 2, nombre: 'Dr. Test' },
  creadoPor: { id: 1, nombre: 'Admin' },
  tratamientos: [],
  pagos: [],
  historial: [],
};

describe('ContratoService', () => {
  let service: ContratoService;

  beforeEach(() => {
    service = new ContratoService();
    vi.clearAllMocks();

    // Default aggregate responses
    mockContratoTratamiento.aggregate.mockResolvedValue({ _sum: { subtotal: null } });
    mockContratoPago.aggregate.mockResolvedValue({ _sum: { monto: null } });
  });

  describe('_computeSubtotal (via addTratamiento path)', () => {
    it('should compute 100 * 2 - 10 = 190', () => {
      // Access via the private method indirectly — test through public interface
      // Direct test via type assertion
      const s = service as unknown as { _computeSubtotal: (p: number, c: number, d: number) => number };
      expect(s._computeSubtotal(100, 2, 10)).toBe(190);
    });

    it('should compute 0 discount correctly', () => {
      const s = service as unknown as { _computeSubtotal: (p: number, c: number, d: number) => number };
      expect(s._computeSubtotal(1000, 3, 0)).toBe(3000);
    });
  });

  describe('cambiarEstado', () => {
    it('should change BORRADOR to ACTIVO successfully', async () => {
      const contratoActivo = { ...baseContrato, estado: 'BORRADOR' };
      mockContrato.findUnique.mockResolvedValue(contratoActivo);
      mockContrato.update.mockResolvedValue({ ...contratoActivo, estado: 'ACTIVO' });
      mockContratoHistorial.create.mockResolvedValue({});

      await service.cambiarEstado('clx-test-id-001', 'ACTIVO', 1, 'Admin');

      expect(mockContrato.update).toHaveBeenCalledWith({
        where: { id: 'clx-test-id-001' },
        data: { estado: 'ACTIVO' },
      });
    });

    it('should throw BadRequestError for COMPLETADO to ACTIVO', async () => {
      const contratoCompletado = { ...baseContrato, estado: 'COMPLETADO' };
      mockContrato.findUnique.mockResolvedValue(contratoCompletado);

      await expect(
        service.cambiarEstado('clx-test-id-001', 'ACTIVO', 1, 'Admin'),
      ).rejects.toThrow('No se puede cambiar de COMPLETADO a ACTIVO');
    });

    it('should throw BadRequestError for CANCELADO to any state', async () => {
      const contratoCancelado = { ...baseContrato, estado: 'CANCELADO' };
      mockContrato.findUnique.mockResolvedValue(contratoCancelado);

      await expect(
        service.cambiarEstado('clx-test-id-001', 'ACTIVO', 1, 'Admin'),
      ).rejects.toThrow('No se puede cambiar de CANCELADO a ACTIVO');
    });

    it('should throw BadRequestError for BORRADOR to CANCELADO (not allowed)', async () => {
      const contrato = { ...baseContrato, estado: 'BORRADOR' };
      mockContrato.findUnique.mockResolvedValue(contrato);

      await expect(
        service.cambiarEstado('clx-test-id-001', 'CANCELADO', 1, 'Admin'),
      ).rejects.toThrow('No se puede cambiar de BORRADOR a CANCELADO');
    });
  });

  describe('delete', () => {
    it('should delete when estado is BORRADOR', async () => {
      mockContrato.findUnique.mockResolvedValue(baseContrato);
      mockContrato.delete.mockResolvedValue(baseContrato);

      await service.delete('clx-test-id-001');

      expect(mockContrato.delete).toHaveBeenCalledWith({ where: { id: 'clx-test-id-001' } });
    });

    it('should throw BadRequestError when estado is ACTIVO', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'ACTIVO' });

      await expect(service.delete('clx-test-id-001')).rejects.toThrow('Solo se pueden eliminar contratos en estado BORRADOR');
    });

    it('should throw BadRequestError when estado is COMPLETADO', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'COMPLETADO' });

      await expect(service.delete('clx-test-id-001')).rejects.toThrow('Solo se pueden eliminar contratos en estado BORRADOR');
    });
  });

  describe('registrarPago', () => {
    it('should throw BadRequestError when contrato is CANCELADO', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'CANCELADO' });

      await expect(
        service.registrarPago(
          'clx-test-id-001',
          { fecha: '2026-01-15', monto: 50000, tipoPago: 'EFECTIVO' },
          1,
          'Admin',
        ),
      ).rejects.toThrow('No se puede registrar un pago en un contrato cancelado');
    });

    it('should create pago when contrato is ACTIVO', async () => {
      mockContrato.findUnique.mockResolvedValue({ ...baseContrato, estado: 'ACTIVO' });
      mockContratoPago.create.mockResolvedValue({ id: 'pago-1' });
      mockContratoHistorial.create.mockResolvedValue({});

      await service.registrarPago(
        'clx-test-id-001',
        { fecha: '2026-01-15', monto: 50000, tipoPago: 'EFECTIVO' },
        1,
        'Admin',
      );

      expect(mockContratoPago.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monto: 50000, tipoPago: 'EFECTIVO', estado: 'APLICADO' }),
        }),
      );
    });
  });

  describe('anularPago', () => {
    it('should throw BadRequestError when pago is already ANULADO', async () => {
      mockContratoPago.findFirst.mockResolvedValue({
        id: 'pago-1',
        contratoId: 'clx-test-id-001',
        estado: 'ANULADO',
        monto: 50000,
        contrato: { moneda: 'CRC' },
      });

      await expect(
        service.anularPago('clx-test-id-001', 'pago-1', undefined, 1, 'Admin'),
      ).rejects.toThrow('Este pago ya está anulado');
    });

    it('should set estado to ANULADO when pago is APLICADO', async () => {
      mockContrato.findUnique.mockResolvedValue(baseContrato);
      mockContratoPago.findFirst.mockResolvedValue({
        id: 'pago-1',
        contratoId: 'clx-test-id-001',
        estado: 'APLICADO',
        monto: 50000,
        contrato: { moneda: 'CRC' },
      });
      mockContratoPago.update.mockResolvedValue({ id: 'pago-1', estado: 'ANULADO' });
      mockContratoHistorial.create.mockResolvedValue({});

      await service.anularPago('clx-test-id-001', 'pago-1', 'Error en monto', 1, 'Admin');

      expect(mockContratoPago.update).toHaveBeenCalledWith({
        where: { id: 'pago-1' },
        data: { estado: 'ANULADO', motivoAnulacion: 'Error en monto' },
      });
    });
  });

  describe('create', () => {
    it('should call prisma.$transaction for create', async () => {
      const txMock = {
        contrato: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ ...baseContrato, id: 'new-id' }),
        },
        contratoTratamiento: { create: vi.fn() },
        contratoHistorial: { create: vi.fn() },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockPrismaClient as any).$transaction.mockImplementation(
        (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
      );

      mockContrato.findUnique.mockResolvedValue(baseContrato);

      const input = {
        pacienteId: 1,
        dentistaId: 2,
        clinicaId: 1,
        fecha: '2026-01-01',
        moneda: 'CRC',
        tratamientos: [],
      };

      await service.create(input, 1, 'Admin');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockPrismaClient as any).$transaction).toHaveBeenCalled();
      expect(txMock.contrato.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clinicaId: 1, creadoPorId: 1 }),
        }),
      );
    });
  });
});
