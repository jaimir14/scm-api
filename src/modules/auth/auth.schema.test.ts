import { describe, it, expect } from 'vitest';
import { loginSchema } from './auth.schema';

describe('loginSchema', () => {
  it('should validate valid login input', () => {
    const result = loginSchema.parse({ usuario: 'admin', password: 'secret' });
    expect(result.usuario).toBe('admin');
    expect(result.password).toBe('secret');
  });

  it('should reject empty usuario', () => {
    expect(() => loginSchema.parse({ usuario: '', password: 'secret' })).toThrow();
  });

  it('should reject missing usuario', () => {
    expect(() => loginSchema.parse({ password: 'secret' })).toThrow();
  });

  it('should reject empty password', () => {
    expect(() => loginSchema.parse({ usuario: 'admin', password: '' })).toThrow();
  });

  it('should reject missing password', () => {
    expect(() => loginSchema.parse({ usuario: 'admin' })).toThrow();
  });
});
