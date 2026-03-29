import { describe, it, expect } from 'vitest';
import { createPatientSchema, updatePatientSchema, patientIdSchema } from './patient.schema';

describe('createPatientSchema', () => {
  it('should validate a complete patient input', () => {
    const input = { name: 'Maria Garcia', address: '123 Main St', phone: '305-555-1234' };
    const result = createPatientSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should reject empty name', () => {
    expect(() =>
      createPatientSchema.parse({ name: '', address: '123 Main St', phone: '555-1234' })
    ).toThrow();
  });

  it('should reject missing name', () => {
    expect(() =>
      createPatientSchema.parse({ address: '123 Main St', phone: '555-1234' })
    ).toThrow();
  });

  it('should reject empty address', () => {
    expect(() =>
      createPatientSchema.parse({ name: 'Test', address: '', phone: '555-1234' })
    ).toThrow();
  });

  it('should reject empty phone', () => {
    expect(() =>
      createPatientSchema.parse({ name: 'Test', address: '123 Main St', phone: '' })
    ).toThrow();
  });

  it('should reject name longer than 255 characters', () => {
    expect(() =>
      createPatientSchema.parse({
        name: 'A'.repeat(256),
        address: '123 Main St',
        phone: '555-1234',
      })
    ).toThrow();
  });

  it('should reject address longer than 500 characters', () => {
    expect(() =>
      createPatientSchema.parse({
        name: 'Test',
        address: 'A'.repeat(501),
        phone: '555-1234',
      })
    ).toThrow();
  });

  it('should reject phone longer than 50 characters', () => {
    expect(() =>
      createPatientSchema.parse({
        name: 'Test',
        address: '123 Main St',
        phone: '5'.repeat(51),
      })
    ).toThrow();
  });

  it('should accept name at max length (255)', () => {
    const result = createPatientSchema.parse({
      name: 'A'.repeat(255),
      address: '123 Main St',
      phone: '555-1234',
    });
    expect(result.name).toHaveLength(255);
  });
});

describe('updatePatientSchema', () => {
  it('should validate a partial update with only name', () => {
    const result = updatePatientSchema.parse({ name: 'New Name' });
    expect(result).toEqual({ name: 'New Name' });
  });

  it('should validate a partial update with only phone', () => {
    const result = updatePatientSchema.parse({ phone: '555-9999' });
    expect(result).toEqual({ phone: '555-9999' });
  });

  it('should validate a full update', () => {
    const input = { name: 'New Name', address: 'New Address', phone: '555-9999' };
    const result = updatePatientSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should accept empty object (all fields optional)', () => {
    const result = updatePatientSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty string for name when provided', () => {
    expect(() => updatePatientSchema.parse({ name: '' })).toThrow();
  });

  it('should reject empty string for address when provided', () => {
    expect(() => updatePatientSchema.parse({ address: '' })).toThrow();
  });

  it('should reject empty string for phone when provided', () => {
    expect(() => updatePatientSchema.parse({ phone: '' })).toThrow();
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
