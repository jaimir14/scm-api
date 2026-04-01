import { describe, it, expect } from 'vitest';
import { createClinicSchema, updateClinicSchema, clinicIdSchema, clinicQuerySchema } from './clinic.schema';

const validClinicInput = {
  nombre: 'Clinica Central',
  direccion: '123 Main St, San Jose',
  telefono: '2222-3333',
};

describe('createClinicSchema', () => {
  it('should validate a complete clinic input', () => {
    const result = createClinicSchema.parse(validClinicInput);
    expect(result.nombre).toBe('Clinica Central');
    expect(result.estado).toBe(true); // default
  });

  it('should accept optional email', () => {
    const result = createClinicSchema.parse({ ...validClinicInput, email: 'test@clinic.com' });
    expect(result.email).toBe('test@clinic.com');
  });

  it('should accept empty string email', () => {
    const result = createClinicSchema.parse({ ...validClinicInput, email: '' });
    expect(result.email).toBe('');
  });

  it('should reject invalid email', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, email: 'not-an-email' }),
    ).toThrow();
  });

  it('should reject empty nombre', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, nombre: '' }),
    ).toThrow();
  });

  it('should reject missing nombre', () => {
    const { nombre, ...rest } = validClinicInput;
    expect(() => createClinicSchema.parse(rest)).toThrow();
  });

  it('should reject empty direccion', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, direccion: '' }),
    ).toThrow();
  });

  it('should reject empty telefono', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, telefono: '' }),
    ).toThrow();
  });

  it('should reject nombre longer than 255 characters', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, nombre: 'A'.repeat(256) }),
    ).toThrow();
  });

  it('should reject direccion longer than 500 characters', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, direccion: 'A'.repeat(501) }),
    ).toThrow();
  });

  it('should reject telefono longer than 50 characters', () => {
    expect(() =>
      createClinicSchema.parse({ ...validClinicInput, telefono: '1'.repeat(51) }),
    ).toThrow();
  });

  it('should accept explicit estado value', () => {
    const result = createClinicSchema.parse({ ...validClinicInput, estado: false });
    expect(result.estado).toBe(false);
  });
});

describe('updateClinicSchema', () => {
  it('should validate a partial update with only nombre', () => {
    const result = updateClinicSchema.parse({ nombre: 'New Name' });
    expect(result).toEqual({ nombre: 'New Name' });
  });

  it('should accept empty object (all fields optional)', () => {
    const result = updateClinicSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty string for nombre when provided', () => {
    expect(() => updateClinicSchema.parse({ nombre: '' })).toThrow();
  });

  it('should reject empty string for direccion when provided', () => {
    expect(() => updateClinicSchema.parse({ direccion: '' })).toThrow();
  });

  it('should reject empty string for telefono when provided', () => {
    expect(() => updateClinicSchema.parse({ telefono: '' })).toThrow();
  });
});

describe('clinicIdSchema', () => {
  it('should parse a valid numeric id', () => {
    const result = clinicIdSchema.parse({ id: 1 });
    expect(result.id).toBe(1);
  });

  it('should coerce string id to number', () => {
    const result = clinicIdSchema.parse({ id: '42' });
    expect(result.id).toBe(42);
  });

  it('should reject zero', () => {
    expect(() => clinicIdSchema.parse({ id: 0 })).toThrow();
  });

  it('should reject negative numbers', () => {
    expect(() => clinicIdSchema.parse({ id: -1 })).toThrow();
  });

  it('should reject non-integer values', () => {
    expect(() => clinicIdSchema.parse({ id: 1.5 })).toThrow();
  });
});

describe('clinicQuerySchema', () => {
  it('should use defaults when empty', () => {
    const result = clinicQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.estado).toBeUndefined();
  });

  it('should parse estado filter', () => {
    const result = clinicQuerySchema.parse({ estado: 'true' });
    expect(result.estado).toBe(true);
  });

  it('should reject page less than 1', () => {
    expect(() => clinicQuerySchema.parse({ page: 0 })).toThrow();
  });

  it('should reject limit greater than 100', () => {
    expect(() => clinicQuerySchema.parse({ limit: 101 })).toThrow();
  });
});
