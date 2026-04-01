import { describe, it, expect } from 'vitest';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentIdSchema,
  appointmentQuerySchema,
} from './appointment.schema';

const validInput = {
  pacienteId: 1,
  profesionalId: 1,
  tipoCitaId: 1,
  fecha: '2026-04-01',
  horaInicio: '09:00',
  horaFin: '09:30',
};

describe('createAppointmentSchema', () => {
  it('should validate a complete input', () => {
    const result = createAppointmentSchema.parse(validInput);
    expect(result.pacienteId).toBe(1);
    expect(result.fecha).toBeInstanceOf(Date);
    expect(result.estado).toBe('PENDIENTE'); // default
  });

  it('should accept optional notas', () => {
    const result = createAppointmentSchema.parse({ ...validInput, notas: 'Test note' });
    expect(result.notas).toBe('Test note');
  });

  it('should reject missing pacienteId', () => {
    const { pacienteId, ...rest } = validInput;
    expect(() => createAppointmentSchema.parse(rest)).toThrow();
  });

  it('should reject missing profesionalId', () => {
    const { profesionalId, ...rest } = validInput;
    expect(() => createAppointmentSchema.parse(rest)).toThrow();
  });

  it('should reject missing tipoCitaId', () => {
    const { tipoCitaId, ...rest } = validInput;
    expect(() => createAppointmentSchema.parse(rest)).toThrow();
  });

  it('should reject empty horaInicio', () => {
    expect(() => createAppointmentSchema.parse({ ...validInput, horaInicio: '' })).toThrow();
  });

  it('should reject empty horaFin', () => {
    expect(() => createAppointmentSchema.parse({ ...validInput, horaFin: '' })).toThrow();
  });

  it('should reject horaInicio longer than 10 characters', () => {
    expect(() =>
      createAppointmentSchema.parse({ ...validInput, horaInicio: 'A'.repeat(11) }),
    ).toThrow();
  });

  it('should accept all valid estado values', () => {
    for (const estado of ['PENDIENTE', 'ATENDIDA', 'CANCELADA'] as const) {
      const result = createAppointmentSchema.parse({ ...validInput, estado });
      expect(result.estado).toBe(estado);
    }
  });

  it('should reject invalid estado', () => {
    expect(() => createAppointmentSchema.parse({ ...validInput, estado: 'INVALID' })).toThrow();
  });
});

describe('updateAppointmentSchema', () => {
  it('should validate a partial update', () => {
    const result = updateAppointmentSchema.parse({ horaInicio: '10:00' });
    expect(result).toEqual({ horaInicio: '10:00' });
  });

  it('should accept empty object', () => {
    const result = updateAppointmentSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty horaInicio when provided', () => {
    expect(() => updateAppointmentSchema.parse({ horaInicio: '' })).toThrow();
  });
});

describe('updateAppointmentStatusSchema', () => {
  it('should validate a valid estado', () => {
    const result = updateAppointmentStatusSchema.parse({ estado: 'ATENDIDA' });
    expect(result.estado).toBe('ATENDIDA');
  });

  it('should reject invalid estado', () => {
    expect(() => updateAppointmentStatusSchema.parse({ estado: 'INVALID' })).toThrow();
  });

  it('should reject missing estado', () => {
    expect(() => updateAppointmentStatusSchema.parse({})).toThrow();
  });
});

describe('appointmentIdSchema', () => {
  it('should parse a valid id', () => {
    expect(appointmentIdSchema.parse({ id: 1 }).id).toBe(1);
  });

  it('should coerce string id', () => {
    expect(appointmentIdSchema.parse({ id: '5' }).id).toBe(5);
  });

  it('should reject zero', () => {
    expect(() => appointmentIdSchema.parse({ id: 0 })).toThrow();
  });
});

describe('appointmentQuerySchema', () => {
  it('should use defaults when empty', () => {
    const result = appointmentQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should parse optional filters', () => {
    const result = appointmentQuerySchema.parse({
      fecha: '2026-04-01',
      profesionalId: '1',
      clinicaId: '2',
      estado: 'PENDIENTE',
    });
    expect(result.fecha).toBe('2026-04-01');
    expect(result.profesionalId).toBe(1);
    expect(result.clinicaId).toBe(2);
    expect(result.estado).toBe('PENDIENTE');
  });

  it('should reject invalid estado', () => {
    expect(() => appointmentQuerySchema.parse({ estado: 'BAD' })).toThrow();
  });
});
