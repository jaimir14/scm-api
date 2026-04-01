import { describe, it, expect } from 'vitest';
import { auditLogQuerySchema } from './audit-log.schema';

describe('auditLogQuerySchema', () => {
  it('should use defaults when empty', () => {
    const result = auditLogQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should parse all optional filters', () => {
    const result = auditLogQuerySchema.parse({
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-12-31',
      usuarioId: '1',
      modulo: 'patients',
      accion: 'CREACION',
    });
    expect(result.fechaDesde).toBe('2026-01-01');
    expect(result.fechaHasta).toBe('2026-12-31');
    expect(result.usuarioId).toBe(1);
    expect(result.modulo).toBe('patients');
    expect(result.accion).toBe('CREACION');
  });

  it('should accept all valid accion values', () => {
    for (const accion of ['INICIO_SESION', 'CREACION', 'ACTUALIZACION', 'ELIMINACION', 'CONSULTA'] as const) {
      const result = auditLogQuerySchema.parse({ accion });
      expect(result.accion).toBe(accion);
    }
  });

  it('should reject invalid accion', () => {
    expect(() => auditLogQuerySchema.parse({ accion: 'INVALID' })).toThrow();
  });

  it('should reject page less than 1', () => {
    expect(() => auditLogQuerySchema.parse({ page: 0 })).toThrow();
  });

  it('should reject limit greater than 100', () => {
    expect(() => auditLogQuerySchema.parse({ limit: 101 })).toThrow();
  });
});
