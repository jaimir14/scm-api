import { describe, it, expect } from 'vitest';
import { updateConfigSchema } from './config.schema';

describe('updateConfigSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = updateConfigSchema.parse({});
    expect(result).toEqual({});
  });

  it('should validate a partial update', () => {
    const result = updateConfigSchema.parse({ nombreSistema: 'My Clinic' });
    expect(result).toEqual({ nombreSistema: 'My Clinic' });
  });

  it('should accept multiple fields', () => {
    const result = updateConfigSchema.parse({
      nombreSistema: 'Clinic System',
      zonaHoraria: 'America/Costa_Rica',
      duracionCitaDefecto: 45,
      restriccionHorario: true,
    });
    expect(result.nombreSistema).toBe('Clinic System');
    expect(result.duracionCitaDefecto).toBe(45);
    expect(result.restriccionHorario).toBe(true);
  });

  it('should reject empty nombreSistema', () => {
    expect(() => updateConfigSchema.parse({ nombreSistema: '' })).toThrow();
  });

  it('should reject empty zonaHoraria', () => {
    expect(() => updateConfigSchema.parse({ zonaHoraria: '' })).toThrow();
  });

  it('should reject empty formatoFecha', () => {
    expect(() => updateConfigSchema.parse({ formatoFecha: '' })).toThrow();
  });

  it('should reject non-positive duracionCitaDefecto', () => {
    expect(() => updateConfigSchema.parse({ duracionCitaDefecto: 0 })).toThrow();
    expect(() => updateConfigSchema.parse({ duracionCitaDefecto: -1 })).toThrow();
  });

  it('should reject non-integer duracionCitaDefecto', () => {
    expect(() => updateConfigSchema.parse({ duracionCitaDefecto: 30.5 })).toThrow();
  });

  it('should reject non-positive tiempoInactividad', () => {
    expect(() => updateConfigSchema.parse({ tiempoInactividad: 0 })).toThrow();
  });

  it('should reject empty horaInicio', () => {
    expect(() => updateConfigSchema.parse({ horaInicio: '' })).toThrow();
  });

  it('should reject empty horaFin', () => {
    expect(() => updateConfigSchema.parse({ horaFin: '' })).toThrow();
  });

  it('should reject nombreSistema longer than 255 characters', () => {
    expect(() => updateConfigSchema.parse({ nombreSistema: 'A'.repeat(256) })).toThrow();
  });

  it('should accept boolean fields', () => {
    const result = updateConfigSchema.parse({
      restriccionHorario: false,
      registrarBitacora: true,
      requerirCambioClave: false,
      recordatorioEmail: true,
      notificarMedico: false,
    });
    expect(result.restriccionHorario).toBe(false);
    expect(result.registrarBitacora).toBe(true);
  });
});
