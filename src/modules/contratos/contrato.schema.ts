import { z } from 'zod';

export const estadoContratoEnum = z.enum(['BORRADOR', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']);
export const estadoItemEnum = z.enum(['PROPUESTO', 'ACEPTADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO']);
export const periodicidadEnum = z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']);
export const tipoPagoEnum = z.enum(['EFECTIVO', 'TARJETA', 'SINPE', 'TRANSFERENCIA', 'CHEQUE', 'OTRO']);
export const estadoPagoEnum = z.enum(['APLICADO', 'ANULADO']);
export const accionContratoEnum = z.enum([
  'CREACION',
  'ACTIVACION',
  'MODIFICACION',
  'ESTADO_CAMBIADO',
  'TRATAMIENTO_AGREGADO',
  'TRATAMIENTO_MODIFICADO',
  'TRATAMIENTO_ELIMINADO',
  'PAGO_REGISTRADO',
  'PAGO_ANULADO',
]);

export const createTratamientoItemSchema = z.object({
  tratamientoId: z.coerce.number().int().positive(),
  pieza: z.string().optional(),
  cantidad: z.coerce.number().int().min(1).default(1),
  precioUnitario: z.coerce.number().min(0),
  descuento: z.coerce.number().min(0).default(0),
  estadoItem: estadoItemEnum.default('PROPUESTO'),
  fechaPropuesta: z.string().optional(),
  observaciones: z.string().optional(),
});

export const addTratamientoSchema = createTratamientoItemSchema;

export const updateTratamientoItemSchema = addTratamientoSchema.partial();

export const createContratoSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
  dentistaId: z.coerce.number().int().positive(),
  clinicaId: z.coerce.number().int().positive(),
  fecha: z.string().min(1),
  descripcion: z.string().optional(),
  moneda: z.string().default('CRC'),
  plazo: z.coerce.number().int().min(1).optional(),
  periodicidad: periodicidadEnum.optional(),
  notas: z.string().optional(),
  tratamientos: z.array(createTratamientoItemSchema).default([]),
});

export const updateContratoSchema = createContratoSchema.omit({ tratamientos: true }).partial();

export const registrarPagoSchema = z.object({
  fecha: z.string().min(1),
  monto: z.coerce.number().positive(),
  tipoPago: tipoPagoEnum,
  concepto: z.string().optional(),
  referencia: z.string().optional(),
  numeroFactura: z.string().optional(),
  autorizacion: z.string().optional(),
  notas: z.string().optional(),
});

export const editarPagoSchema = registrarPagoSchema.partial();

export const anularPagoSchema = z.object({
  motivoAnulacion: z.string().optional(),
});

export const cambiarEstadoSchema = z.object({
  estado: estadoContratoEnum,
});

export const contratoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  estado: estadoContratoEnum.optional(),
  pacienteId: z.coerce.number().int().positive().optional(),
  dentistaId: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const itemIdParamSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
});

export const pagoIdParamSchema = z.object({
  id: z.string().min(1),
  pagoId: z.string().min(1),
});

export type EstadoContrato = z.infer<typeof estadoContratoEnum>;
export type EstadoItem = z.infer<typeof estadoItemEnum>;
export type Periodicidad = z.infer<typeof periodicidadEnum>;
export type TipoPago = z.infer<typeof tipoPagoEnum>;
export type EstadoPago = z.infer<typeof estadoPagoEnum>;
export type AccionContrato = z.infer<typeof accionContratoEnum>;
export type CreateTratamientoItemInput = z.infer<typeof createTratamientoItemSchema>;
export type AddTratamientoInput = z.infer<typeof addTratamientoSchema>;
export type UpdateTratamientoItemInput = z.infer<typeof updateTratamientoItemSchema>;
export type CreateContratoInput = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput = z.infer<typeof updateContratoSchema>;
export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type EditarPagoInput = z.infer<typeof editarPagoSchema>;
export type AnularPagoInput = z.infer<typeof anularPagoSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type ContratoQuery = z.infer<typeof contratoQuerySchema>;
