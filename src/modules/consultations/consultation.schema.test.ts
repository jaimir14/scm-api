import { describe, it, expect } from 'vitest';
import {
  createConsultationSchema,
  updateConsultationSchema,
  consultationIdSchema,
  patientIdParamSchema,
} from './consultation.schema';

const validInput = {
  pacienteId: 1,
  profesionalId: 1,
  fecha: '2026-03-15',
  peso: 70,
  motivoConsulta: 'Control general',
};

describe('createConsultationSchema', () => {
  it('should validate a minimal input', () => {
    const result = createConsultationSchema.parse(validInput);
    expect(result.pacienteId).toBe(1);
    expect(result.profesionalId).toBe(1);
    expect(result.fecha).toBeInstanceOf(Date);
    expect(result.ocultar).toBe(false); // default
  });

  it('should accept optional vital signs', () => {
    const result = createConsultationSchema.parse({
      ...validInput,
      peso: 70.5,
      talla: 170,
      temperatura: 36.5,
      presionArterial: '120/80',
      frecuenciaCardiaca: 72,
      frecuenciaRespiratoria: 16,
      satO2: 98.5,
    });
    expect(result.peso).toBe(70.5);
    expect(result.presionArterial).toBe('120/80');
  });

  it('should accept optional text fields', () => {
    const result = createConsultationSchema.parse({
      ...validInput,
      motivoConsulta: 'Dolor de muela',
      examenFisico: 'Normal',
      impresionDiagnostica: 'Caries',
      indicacionesTratamientos: 'Extraccion',
    });
    expect(result.motivoConsulta).toBe('Dolor de muela');
  });

  it('should reject missing pacienteId', () => {
    const { pacienteId, ...rest } = validInput;
    expect(() => createConsultationSchema.parse(rest)).toThrow();
  });

  it('should reject missing profesionalId', () => {
    const { profesionalId, ...rest } = validInput;
    expect(() => createConsultationSchema.parse(rest)).toThrow();
  });

  it('should reject missing fecha', () => {
    const { fecha, ...rest } = validInput;
    expect(() => createConsultationSchema.parse(rest)).toThrow();
  });

  it('should reject non-positive pacienteId', () => {
    expect(() => createConsultationSchema.parse({ ...validInput, pacienteId: 0 })).toThrow();
  });

  it('should reject missing peso', () => {
    const { peso, ...rest } = validInput;
    expect(() => createConsultationSchema.parse(rest)).toThrow();
  });

  it('should reject non-positive peso', () => {
    expect(() => createConsultationSchema.parse({ ...validInput, peso: 0 })).toThrow();
  });

  it('should reject missing motivoConsulta', () => {
    const { motivoConsulta, ...rest } = validInput;
    expect(() => createConsultationSchema.parse(rest)).toThrow();
  });

  it('should reject empty motivoConsulta', () => {
    expect(() => createConsultationSchema.parse({ ...validInput, motivoConsulta: '' })).toThrow();
  });

  it('should coerce string peso to number', () => {
    const result = createConsultationSchema.parse({ ...validInput, peso: '75.5' });
    expect(result.peso).toBe(75.5);
  });

  it('should treat empty string peso as missing', () => {
    expect(() => createConsultationSchema.parse({ ...validInput, peso: '' })).toThrow();
  });

  it('should reject presionArterial longer than 20 characters', () => {
    expect(() =>
      createConsultationSchema.parse({ ...validInput, presionArterial: 'A'.repeat(21) }),
    ).toThrow();
  });
});

describe('updateConsultationSchema', () => {
  it('should validate a partial update', () => {
    const result = updateConsultationSchema.parse({ peso: 72 });
    expect(result).toEqual({ peso: 72 });
  });

  it('should accept empty object', () => {
    const result = updateConsultationSchema.parse({});
    expect(result).toEqual({});
  });

  it('should accept nullable fields', () => {
    const result = updateConsultationSchema.parse({ peso: null, motivoConsulta: null });
    expect(result.peso).toBeNull();
    expect(result.motivoConsulta).toBeNull();
  });
});

describe('consultationIdSchema', () => {
  it('should parse a valid id', () => {
    expect(consultationIdSchema.parse({ id: 1 }).id).toBe(1);
  });

  it('should coerce string id', () => {
    expect(consultationIdSchema.parse({ id: '5' }).id).toBe(5);
  });

  it('should reject zero', () => {
    expect(() => consultationIdSchema.parse({ id: 0 })).toThrow();
  });
});

describe('patientIdParamSchema', () => {
  it('should parse a valid patientId', () => {
    expect(patientIdParamSchema.parse({ patientId: 1 }).patientId).toBe(1);
  });

  it('should coerce string patientId', () => {
    expect(patientIdParamSchema.parse({ patientId: '10' }).patientId).toBe(10);
  });

  it('should reject zero', () => {
    expect(() => patientIdParamSchema.parse({ patientId: 0 })).toThrow();
  });
});
