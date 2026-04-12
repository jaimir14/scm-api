import { describe, it, expect } from 'vitest';
import {
  appointmentReportSchema,
  patientReportSchema,
  clinicReportSchema,
  treatmentReportSchema,
  userReportSchema,
} from './report.schema';

describe('appointmentReportSchema', () => {
  it('should accept empty query', () => {
    const result = appointmentReportSchema.parse({});
    expect(result).toEqual({});
  });

  it('should parse all filters', () => {
    const result = appointmentReportSchema.parse({
      desde: '2026-01-01',
      hasta: '2026-12-31',
      profesionalId: '1',
      clinicaId: '2',
      estado: 'PENDIENTE',
    });
    expect(result.desde).toBe('2026-01-01');
    expect(result.profesionalId).toBe(1);
    expect(result.clinicaId).toBe(2);
    expect(result.estado).toBe('PENDIENTE');
  });

  it('should reject invalid estado', () => {
    expect(() => appointmentReportSchema.parse({ estado: 'INVALID' })).toThrow();
  });
});

describe('patientReportSchema', () => {
  it('should accept empty query', () => {
    const result = patientReportSchema.parse({});
    expect(result).toEqual({});
  });

  it('should parse filters', () => {
    const result = patientReportSchema.parse({
      clinicaId: '1',
      profesionalId: '2',
      sexo: 'MASCULINO',
    });
    expect(result.clinicaId).toBe(1);
    expect(result.sexo).toBe('MASCULINO');
  });

  it('should reject invalid sexo', () => {
    expect(() => patientReportSchema.parse({ sexo: 'OTHER' })).toThrow();
  });
});

describe('clinicReportSchema', () => {
  it('should accept empty query', () => {
    const result = clinicReportSchema.parse({});
    expect(result).toEqual({});
  });

  it('should parse estado filter', () => {
    const result = clinicReportSchema.parse({ estado: 'true' });
    expect(result.estado).toBe(true);
  });
});

describe('treatmentReportSchema', () => {
  it('should accept empty query', () => {
    const result = treatmentReportSchema.parse({});
    expect(result).toEqual({});
  });

  it('should parse categoria filter', () => {
    const result = treatmentReportSchema.parse({ categoria: 'CIRUGIA' });
    expect(result.categoria).toBe('CIRUGIA');
  });

  it('should reject invalid categoria', () => {
    expect(() => treatmentReportSchema.parse({ categoria: 'BAD' })).toThrow();
  });
});

describe('userReportSchema', () => {
  it('should accept empty query', () => {
    const result = userReportSchema.parse({});
    expect(result).toEqual({});
  });

  it('should parse filters', () => {
    const result = userReportSchema.parse({ rolId: '1', estado: 'true' });
    expect(result.rolId).toBe(1);
    expect(result.estado).toBe(true);
  });

  it('should reject invalid rolId', () => {
    expect(() => userReportSchema.parse({ rolId: '0' })).toThrow();
  });
});
