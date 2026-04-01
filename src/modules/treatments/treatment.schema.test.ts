import { describe, it, expect } from 'vitest';
import {
  createTreatmentSchema,
  updateTreatmentSchema,
  treatmentIdSchema,
  treatmentQuerySchema,
} from './treatment.schema';

const validInput = {
  codigo: 'PREV-001',
  nombre: 'Limpieza Dental',
  categoria: 'PREVENTIVO' as const,
  precio: 50000,
};

describe('createTreatmentSchema', () => {
  it('should validate a complete input', () => {
    const result = createTreatmentSchema.parse(validInput);
    expect(result.codigo).toBe('PREV-001');
    expect(result.estado).toBe(true);
  });

  it('should reject empty codigo', () => {
    expect(() => createTreatmentSchema.parse({ ...validInput, codigo: '' })).toThrow();
  });

  it('should reject missing nombre', () => {
    const { nombre, ...rest } = validInput;
    expect(() => createTreatmentSchema.parse(rest)).toThrow();
  });

  it('should reject invalid categoria', () => {
    expect(() => createTreatmentSchema.parse({ ...validInput, categoria: 'INVALID' })).toThrow();
  });

  it('should accept all valid categoria values', () => {
    for (const cat of ['PREVENTIVO', 'CIRUGIA', 'RESTAURACION', 'ORTODONCIA'] as const) {
      const result = createTreatmentSchema.parse({ ...validInput, categoria: cat });
      expect(result.categoria).toBe(cat);
    }
  });

  it('should reject non-positive precio', () => {
    expect(() => createTreatmentSchema.parse({ ...validInput, precio: 0 })).toThrow();
    expect(() => createTreatmentSchema.parse({ ...validInput, precio: -1 })).toThrow();
  });

  it('should reject codigo longer than 50 characters', () => {
    expect(() =>
      createTreatmentSchema.parse({ ...validInput, codigo: 'A'.repeat(51) }),
    ).toThrow();
  });

  it('should reject nombre longer than 255 characters', () => {
    expect(() =>
      createTreatmentSchema.parse({ ...validInput, nombre: 'A'.repeat(256) }),
    ).toThrow();
  });
});

describe('updateTreatmentSchema', () => {
  it('should validate a partial update', () => {
    const result = updateTreatmentSchema.parse({ precio: 75000 });
    expect(result).toEqual({ precio: 75000 });
  });

  it('should accept empty object', () => {
    const result = updateTreatmentSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty codigo when provided', () => {
    expect(() => updateTreatmentSchema.parse({ codigo: '' })).toThrow();
  });

  it('should reject non-positive precio when provided', () => {
    expect(() => updateTreatmentSchema.parse({ precio: 0 })).toThrow();
  });
});

describe('treatmentIdSchema', () => {
  it('should parse a valid id', () => {
    expect(treatmentIdSchema.parse({ id: 1 }).id).toBe(1);
  });

  it('should coerce string id', () => {
    expect(treatmentIdSchema.parse({ id: '42' }).id).toBe(42);
  });

  it('should reject zero', () => {
    expect(() => treatmentIdSchema.parse({ id: 0 })).toThrow();
  });
});

describe('treatmentQuerySchema', () => {
  it('should use defaults when empty', () => {
    const result = treatmentQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.categoria).toBeUndefined();
  });

  it('should parse categoria filter', () => {
    const result = treatmentQuerySchema.parse({ categoria: 'CIRUGIA' });
    expect(result.categoria).toBe('CIRUGIA');
  });

  it('should reject invalid categoria', () => {
    expect(() => treatmentQuerySchema.parse({ categoria: 'INVALID' })).toThrow();
  });
});
