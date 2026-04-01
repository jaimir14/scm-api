import { describe, it, expect } from 'vitest';
import { createPatientSchema, updatePatientSchema, patientIdSchema, patientSearchSchema } from './patient.schema';

const validPatientInput = {
  nombre: 'Maria',
  apellido1: 'Garcia',
  tipoIdentificacion: 'CEDULA' as const,
  numeroIdentificacion: '123456789',
  telefonoCelular: '305-555-1234',
  sexo: 'FEMENINO' as const,
  estadoCivil: 'SOLTERO' as const,
  direccion: '123 Main St',
  fechaNacimiento: '1990-01-01',
  clinicaId: 1,
  profesionalId: 1,
};

describe('createPatientSchema', () => {
  it('should validate a complete patient input', () => {
    const result = createPatientSchema.parse(validPatientInput);
    expect(result.nombre).toBe('Maria');
    expect(result.apellido1).toBe('Garcia');
  });

  it('should reject empty nombre', () => {
    expect(() =>
      createPatientSchema.parse({ ...validPatientInput, nombre: '' }),
    ).toThrow();
  });

  it('should reject missing nombre', () => {
    const { nombre, ...rest } = validPatientInput;
    expect(() => createPatientSchema.parse(rest)).toThrow();
  });

  it('should reject empty direccion', () => {
    expect(() =>
      createPatientSchema.parse({ ...validPatientInput, direccion: '' }),
    ).toThrow();
  });

  it('should reject empty telefonoCelular', () => {
    expect(() =>
      createPatientSchema.parse({ ...validPatientInput, telefonoCelular: '' }),
    ).toThrow();
  });

  it('should reject nombre longer than 255 characters', () => {
    expect(() =>
      createPatientSchema.parse({ ...validPatientInput, nombre: 'A'.repeat(256) }),
    ).toThrow();
  });

  it('should reject direccion longer than 500 characters', () => {
    expect(() =>
      createPatientSchema.parse({ ...validPatientInput, direccion: 'A'.repeat(501) }),
    ).toThrow();
  });

  it('should accept nombre at max length (255)', () => {
    const result = createPatientSchema.parse({
      ...validPatientInput,
      nombre: 'A'.repeat(255),
    });
    expect(result.nombre).toHaveLength(255);
  });
});

describe('updatePatientSchema', () => {
  it('should validate a partial update with only nombre', () => {
    const result = updatePatientSchema.parse({ nombre: 'New Name' });
    expect(result).toEqual({ nombre: 'New Name' });
  });

  it('should validate a partial update with only telefonoCelular', () => {
    const result = updatePatientSchema.parse({ telefonoCelular: '555-9999' });
    expect(result).toEqual({ telefonoCelular: '555-9999' });
  });

  it('should accept empty object (all fields optional)', () => {
    const result = updatePatientSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty string for nombre when provided', () => {
    expect(() => updatePatientSchema.parse({ nombre: '' })).toThrow();
  });

  it('should reject empty string for direccion when provided', () => {
    expect(() => updatePatientSchema.parse({ direccion: '' })).toThrow();
  });

  it('should reject empty string for telefonoCelular when provided', () => {
    expect(() => updatePatientSchema.parse({ telefonoCelular: '' })).toThrow();
  });
});

describe('patientIdSchema', () => {
  it('should parse a valid numeric id', () => {
    const result = patientIdSchema.parse({ id: 1 });
    expect(result.id).toBe(1);
  });

  it('should coerce string id to number', () => {
    const result = patientIdSchema.parse({ id: '42' });
    expect(result.id).toBe(42);
  });

  it('should reject zero', () => {
    expect(() => patientIdSchema.parse({ id: 0 })).toThrow();
  });

  it('should reject negative numbers', () => {
    expect(() => patientIdSchema.parse({ id: -1 })).toThrow();
  });

  it('should reject non-integer values', () => {
    expect(() => patientIdSchema.parse({ id: 1.5 })).toThrow();
  });
});

describe('patientSearchSchema', () => {
  it('should validate a valid search query', () => {
    const result = patientSearchSchema.parse({ q: 'Maria' });
    expect(result.q).toBe('Maria');
    expect(result.type).toBe('nombre'); // default
  });

  it('should accept type cedula', () => {
    const result = patientSearchSchema.parse({ q: '123', type: 'cedula' });
    expect(result.type).toBe('cedula');
  });

  it('should reject empty q', () => {
    expect(() => patientSearchSchema.parse({ q: '' })).toThrow();
  });

  it('should reject missing q', () => {
    expect(() => patientSearchSchema.parse({})).toThrow();
  });

  it('should reject invalid type', () => {
    expect(() => patientSearchSchema.parse({ q: 'test', type: 'invalid' })).toThrow();
  });
});
