import { describe, it, expect } from 'vitest';
import { professionalIdSchema } from './professional.schema';

describe('professionalIdSchema', () => {
  it('should parse a valid numeric id', () => {
    const result = professionalIdSchema.parse({ id: 1 });
    expect(result.id).toBe(1);
  });

  it('should coerce string id to number', () => {
    const result = professionalIdSchema.parse({ id: '42' });
    expect(result.id).toBe(42);
  });

  it('should reject zero', () => {
    expect(() => professionalIdSchema.parse({ id: 0 })).toThrow();
  });

  it('should reject negative numbers', () => {
    expect(() => professionalIdSchema.parse({ id: -1 })).toThrow();
  });
});
