import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, userIdSchema } from './user.schema';

const validInput = {
  usuario: 'jdoe',
  nombre: 'John Doe',
  password: 'secret123',
  rol: 'ADMINISTRADOR' as const,
};

describe('createUserSchema', () => {
  it('should validate a complete user input', () => {
    const result = createUserSchema.parse(validInput);
    expect(result.usuario).toBe('jdoe');
    expect(result.estado).toBe(true); // default
  });

  it('should reject empty usuario', () => {
    expect(() => createUserSchema.parse({ ...validInput, usuario: '' })).toThrow();
  });

  it('should reject missing usuario', () => {
    const { usuario, ...rest } = validInput;
    expect(() => createUserSchema.parse(rest)).toThrow();
  });

  it('should reject empty nombre', () => {
    expect(() => createUserSchema.parse({ ...validInput, nombre: '' })).toThrow();
  });

  it('should reject password shorter than 6 characters', () => {
    expect(() => createUserSchema.parse({ ...validInput, password: '12345' })).toThrow();
  });

  it('should reject password longer than 255 characters', () => {
    expect(() => createUserSchema.parse({ ...validInput, password: 'A'.repeat(256) })).toThrow();
  });

  it('should reject invalid rol', () => {
    expect(() => createUserSchema.parse({ ...validInput, rol: 'INVALID' })).toThrow();
  });

  it('should accept all valid rol values', () => {
    for (const rol of ['ADMINISTRADOR', 'MEDICO', 'RECEPCION', 'ENFERMERIA'] as const) {
      const result = createUserSchema.parse({ ...validInput, rol });
      expect(result.rol).toBe(rol);
    }
  });

  it('should accept usuario at max length (100)', () => {
    const result = createUserSchema.parse({ ...validInput, usuario: 'A'.repeat(100) });
    expect(result.usuario).toHaveLength(100);
  });

  it('should reject usuario longer than 100 characters', () => {
    expect(() => createUserSchema.parse({ ...validInput, usuario: 'A'.repeat(101) })).toThrow();
  });
});

describe('updateUserSchema', () => {
  it('should validate a partial update with only nombre', () => {
    const result = updateUserSchema.parse({ nombre: 'New Name' });
    expect(result).toEqual({ nombre: 'New Name' });
  });

  it('should accept empty object (all fields optional)', () => {
    const result = updateUserSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject empty string for usuario when provided', () => {
    expect(() => updateUserSchema.parse({ usuario: '' })).toThrow();
  });

  it('should reject empty string for nombre when provided', () => {
    expect(() => updateUserSchema.parse({ nombre: '' })).toThrow();
  });

  it('should reject short password when provided', () => {
    expect(() => updateUserSchema.parse({ password: '123' })).toThrow();
  });
});

describe('userIdSchema', () => {
  it('should parse a valid numeric id', () => {
    const result = userIdSchema.parse({ id: 1 });
    expect(result.id).toBe(1);
  });

  it('should coerce string id to number', () => {
    const result = userIdSchema.parse({ id: '42' });
    expect(result.id).toBe(42);
  });

  it('should reject zero', () => {
    expect(() => userIdSchema.parse({ id: 0 })).toThrow();
  });

  it('should reject negative numbers', () => {
    expect(() => userIdSchema.parse({ id: -1 })).toThrow();
  });
});
