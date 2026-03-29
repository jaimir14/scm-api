import { describe, it, expect } from 'vitest';
import { paginationSchema } from './pagination.schema';

describe('paginationSchema', () => {
  it('should parse valid pagination query', () => {
    const result = paginationSchema.parse({ page: '2', limit: '50' });
    expect(result).toEqual({ page: 2, limit: 50 });
  });

  it('should use defaults when no values provided', () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('should coerce string values to numbers', () => {
    const result = paginationSchema.parse({ page: '3', limit: '10' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('should reject page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
    expect(() => paginationSchema.parse({ page: -1 })).toThrow();
  });

  it('should reject limit less than 1', () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
  });

  it('should reject limit greater than 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it('should accept limit of exactly 100', () => {
    const result = paginationSchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it('should reject non-integer values', () => {
    expect(() => paginationSchema.parse({ page: 1.5 })).toThrow();
  });
});
