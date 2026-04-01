import { describe, it, expect } from 'vitest';
import {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  appointmentTypeIdSchema,
} from './appointment-type.schema';

const validInput = {
  nombre: 'Consulta General',
  duracion: 30,
};

describe('createAppointmentTypeSchema', () => {
  it('should validate a complete input', () => {
    const result = createAppointmentTypeSchema.parse(validInput);
    expect(result.nombre).toBe('Consulta General');
    expect(result.duracion).toBe(30);
    expect(result.estado).toBe(true); // default
  });

  it('should reject empty nombre', () => {
    expect(() => createAppointmentTypeSchema.parse({ ...validInput, nombre: '' })).toThrow();
  });

  it('should reject missing nombre', () => {
    expect(() => createAppointmentTypeSchema.parse({ duracion: 30 })).toThrow();
  });

  it('should reject missing duracion', () => {
    expect(() => createAppointmentTypeSchema.parse({ nombre: 'Test' })).toThrow();
  });

  it('should reject zero duracion', () => {
    expect(() => createAppointmentTypeSchema.parse({ ...validInput, duracion: 0 })).toThrow();
  });

  it('should reject negative duracion', () => {
    expect(() => createAppointmentTypeSchema.parse({ ...validInput, duracion: -1 })).toThrow();
  });

  it('should reject non-integer duracion', () => {
    expect(() => createAppointmentTypeSchema.parse({ ...validInput, duracion: 30.5 })).toThrow();
  });

  it('should reject nombre longer than 255 characters', () => {
    expect(() =>
      createAppointmentTypeSchema.parse({ ...validInput, nombre: 'A'.repeat(256) }),
    ).toThrow();
  });
});

describe('updateAppointmentTypeSchema', () => {
  it('should validate a partial update', () => {
    const result = updateAppointmentTypeSchema.parse({ nombre: 'New Name' });
    expect(result).toEqual({ nombre: 'New Name' });
  });

  it('should accept empty object', () => {
    const result = updateAppointmentTypeSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty nombre when provided', () => {
    expect(() => updateAppointmentTypeSchema.parse({ nombre: '' })).toThrow();
  });

  it('should reject non-positive duracion when provided', () => {
    expect(() => updateAppointmentTypeSchema.parse({ duracion: 0 })).toThrow();
  });
});

describe('appointmentTypeIdSchema', () => {
  it('should parse a valid numeric id', () => {
    expect(appointmentTypeIdSchema.parse({ id: 1 }).id).toBe(1);
  });

  it('should coerce string id to number', () => {
    expect(appointmentTypeIdSchema.parse({ id: '5' }).id).toBe(5);
  });

  it('should reject zero', () => {
    expect(() => appointmentTypeIdSchema.parse({ id: 0 })).toThrow();
  });

  it('should reject negative', () => {
    expect(() => appointmentTypeIdSchema.parse({ id: -1 })).toThrow();
  });
});
