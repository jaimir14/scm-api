import { describe, it, expect } from 'vitest';
import {
  createContratoSchema,
  registrarPagoSchema,
  cambiarEstadoSchema,
} from './contrato.schema';

describe('createContratoSchema', () => {
  const validInput = {
    pacienteId: 1,
    dentistaId: 2,
    clinicaId: 1,
    fecha: '2026-01-01',
    moneda: 'CRC',
    tratamientos: [],
  };

  it('should parse valid full input', () => {
    const result = createContratoSchema.safeParse({
      ...validInput,
      descripcion: 'Descripción del contrato',
      plazo: 12,
      periodicidad: 'MENSUAL',
      notas: 'Notas del contrato',
      tratamientos: [
        {
          tratamientoId: 1,
          cantidad: 2,
          precioUnitario: 50000,
          descuento: 5000,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tratamientos[0].precioUnitario).toBe(50000);
      expect(result.data.tratamientos[0].cantidad).toBe(2);
    }
  });

  it('should fail when dentistaId is missing', () => {
    const { dentistaId: _, ...withoutDentista } = validInput;
    const result = createContratoSchema.safeParse(withoutDentista);
    expect(result.success).toBe(false);
  });

  it('should fail when pacienteId is missing', () => {
    const { pacienteId: _, ...withoutPaciente } = validInput;
    const result = createContratoSchema.safeParse(withoutPaciente);
    expect(result.success).toBe(false);
  });

  it('should fail when tratamiento has negative precioUnitario', () => {
    const result = createContratoSchema.safeParse({
      ...validInput,
      tratamientos: [
        {
          tratamientoId: 1,
          precioUnitario: -100,
          cantidad: 1,
          descuento: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should default tratamientos to empty array', () => {
    const result = createContratoSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tratamientos).toEqual([]);
    }
  });

  it('should fail when fecha is missing', () => {
    const { fecha: _, ...withoutFecha } = validInput;
    const result = createContratoSchema.safeParse(withoutFecha);
    expect(result.success).toBe(false);
  });
});

describe('registrarPagoSchema', () => {
  const validPago = {
    fecha: '2026-01-15',
    monto: 50000,
    tipoPago: 'EFECTIVO',
  };

  it('should parse valid pago', () => {
    const result = registrarPagoSchema.safeParse(validPago);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monto).toBe(50000);
      expect(result.data.tipoPago).toBe('EFECTIVO');
    }
  });

  it('should fail when monto is 0', () => {
    const result = registrarPagoSchema.safeParse({ ...validPago, monto: 0 });
    expect(result.success).toBe(false);
  });

  it('should fail when monto is negative', () => {
    const result = registrarPagoSchema.safeParse({ ...validPago, monto: -100 });
    expect(result.success).toBe(false);
  });

  it('should fail when tipoPago is missing', () => {
    const { tipoPago: _, ...withoutTipo } = validPago;
    const result = registrarPagoSchema.safeParse(withoutTipo);
    expect(result.success).toBe(false);
  });

  it('should fail when tipoPago is invalid', () => {
    const result = registrarPagoSchema.safeParse({ ...validPago, tipoPago: 'BITCOIN' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid tipoPago values', () => {
    const tipos = ['EFECTIVO', 'TARJETA', 'SINPE', 'TRANSFERENCIA', 'CHEQUE', 'OTRO'];
    for (const tipoPago of tipos) {
      const result = registrarPagoSchema.safeParse({ ...validPago, tipoPago });
      expect(result.success).toBe(true);
    }
  });
});

describe('cambiarEstadoSchema', () => {
  it('should accept valid estado values', () => {
    const estados = ['BORRADOR', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'];
    for (const estado of estados) {
      const result = cambiarEstadoSchema.safeParse({ estado });
      expect(result.success).toBe(true);
    }
  });

  it('should fail for invalid estado value', () => {
    const result = cambiarEstadoSchema.safeParse({ estado: 'PENDIENTE' });
    expect(result.success).toBe(false);
  });

  it('should fail when estado is missing', () => {
    const result = cambiarEstadoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
