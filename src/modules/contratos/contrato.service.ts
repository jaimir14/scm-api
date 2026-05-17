import { prisma } from '../../database';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { PaginatedResponse } from '../../common/schemas';
import {
  CreateContratoInput,
  UpdateContratoInput,
  AddTratamientoInput,
  UpdateTratamientoItemInput,
  RegistrarPagoInput,
  EditarPagoInput,
  ContratoQuery,
  AccionContrato,
} from './contrato.schema';
import { Prisma, EstadoContrato as PrismaEstadoContrato } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient;

const _includeRelations = {
  paciente: {
    select: {
      id: true,
      nombre: true,
      apellido1: true,
      apellido2: true,
      numeroIdentificacion: true,
      tipoIdentificacion: true,
    },
  },
  dentista: { select: { id: true, nombre: true } },
  creadoPor: { select: { id: true, nombre: true } },
  tratamientos: {
    include: {
      tratamiento: { select: { id: true, nombre: true, codigo: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  pagos: {
    include: {
      registradoPor: { select: { id: true, nombre: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  historial: { orderBy: { createdAt: 'desc' as const } },
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  BORRADOR: ['ACTIVO'],
  ACTIVO: ['PAUSADO', 'COMPLETADO', 'CANCELADO'],
  PAUSADO: ['ACTIVO', 'CANCELADO'],
  COMPLETADO: [],
  CANCELADO: [],
};

export class ContratoService {
  private _computeSubtotal(precioUnitario: number, cantidad: number, descuento: number): number {
    return precioUnitario * cantidad - descuento;
  }

  private _validateTransition(current: string, next: string): void {
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestError(`No se puede cambiar de ${current} a ${next}`);
    }
  }

  private async _calcularTotales(contratoId: string) {
    const [tratResult, pagoResult] = await Promise.all([
      prisma.contratoTratamiento.aggregate({
        _sum: { subtotal: true },
        where: { contratoId, estadoItem: { not: 'CANCELADO' } },
      }),
      prisma.contratoPago.aggregate({
        _sum: { monto: true },
        where: { contratoId, estado: 'APLICADO' },
      }),
    ]);

    const montoTotal = Number(tratResult._sum.subtotal ?? 0);
    const montoPagado = Number(pagoResult._sum.monto ?? 0);
    const saldo = montoTotal - montoPagado;

    return { montoTotal, montoPagado, saldo };
  }

  private async _calcularTotalesBatch(contratoIds: string[]) {
    if (contratoIds.length === 0) return new Map();

    const [tratTotals, pagoTotals] = await Promise.all([
      prisma.contratoTratamiento.groupBy({
        by: ['contratoId'],
        _sum: { subtotal: true },
        where: { contratoId: { in: contratoIds }, estadoItem: { not: 'CANCELADO' } },
      }),
      prisma.contratoPago.groupBy({
        by: ['contratoId'],
        _sum: { monto: true },
        where: { contratoId: { in: contratoIds }, estado: 'APLICADO' },
      }),
    ]);

    const result = new Map();
    for (const id of contratoIds) {
      const trat = tratTotals.find(t => t.contratoId === id);
      const pago = pagoTotals.find(p => p.contratoId === id);
      
      const montoTotal = Number(trat?._sum?.subtotal ?? 0);
      const montoPagado = Number(pago?._sum?.monto ?? 0);
      result.set(id, {
        montoTotal,
        montoPagado,
        saldo: montoTotal - montoPagado
      });
    }

    return result;
  }

  private async _addHistorial(
    contratoId: string,
    accion: AccionContrato,
    descripcion: string,
    usuarioId: number,
    nombreUsuario: string,
    detalle?: Prisma.InputJsonValue | null,
    tx?: PrismaTx,
  ) {
    const client = tx ?? prisma;
    await client.contratoHistorial.create({
      data: {
        contratoId,
        accion,
        descripcion,
        usuarioId,
        nombreUsuario,
        detalle: detalle ?? undefined,
      },
    });
  }

  private async _generateNumero(clinicaId: number, tx: PrismaTx): Promise<string> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const startOfNextYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const count = await tx.contrato.count({
      where: {
        clinicaId,
        createdAt: { gte: startOfYear, lt: startOfNextYear },
      },
    });

    return `CONT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: ContratoQuery, clinicaId?: number | null): Promise<PaginatedResponse<unknown>> {
    const { page, limit, q, estado, pacienteId, dentistaId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContratoWhereInput = {
      ...(clinicaId ? { clinicaId } : {}),
      ...(estado ? { estado } : {}),
      ...(pacienteId ? { pacienteId } : {}),
      ...(dentistaId ? { dentistaId } : {}),
      ...(q
        ? {
            OR: [
              { numero: { contains: q } },
              { paciente: { nombre: { contains: q } } },
              { paciente: { apellido1: { contains: q } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.contrato.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          paciente: { select: { id: true, nombre: true, apellido1: true } },
          dentista: { select: { id: true, nombre: true } },
          creadoPor: { select: { id: true, nombre: true } },
        },
      }),
      prisma.contrato.count({ where }),
    ]);

    const ids = data.map(c => c.id);
    const totalesMap = await this._calcularTotalesBatch(ids);

    const dataWithTotals = data.map(contrato => {
      return { ...contrato, ...totalesMap.get(contrato.id) };
    });

    return {
      data: dataWithTotals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, clinicaId?: number | null) {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: _includeRelations,
    });

    if (!contrato) {
      throw new NotFoundError('Contrato');
    }
    if (clinicaId && contrato.clinicaId !== clinicaId) {
      throw new NotFoundError('Contrato');
    }

    const totales = await this._calcularTotales(id);
    return { ...contrato, ...totales };
  }

  async findByPaciente(pacienteId: number, clinicaId?: number | null) {
    const data = await prisma.contrato.findMany({
      where: {
        pacienteId,
        ...(clinicaId ? { clinicaId } : {}),
      },
      include: {
        paciente: { select: { id: true, nombre: true, apellido1: true } },
        dentista: { select: { id: true, nombre: true } },
        creadoPor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ids = data.map(c => c.id);
    const totalesMap = await this._calcularTotalesBatch(ids);

    return data.map(contrato => {
      return { ...contrato, ...totalesMap.get(contrato.id) };
    });
  }

  async create(input: CreateContratoInput, usuarioId: number, nombreUsuario: string) {
    let retries = 3;
    let lastError: any;
    
    while (retries > 0) {
      try {
        const contrato = await prisma.$transaction(async tx => {
          const numero = await this._generateNumero(input.clinicaId, tx);

          const { tratamientos, ...contratoData } = input;

          const created = await tx.contrato.create({
            data: {
              ...contratoData,
              numero,
              fecha: new Date(input.fecha),
              creadoPorId: usuarioId,
            },
          });

          for (const item of tratamientos) {
            const subtotal = this._computeSubtotal(item.precioUnitario, item.cantidad, item.descuento);
            await tx.contratoTratamiento.create({
              data: {
                contratoId: created.id,
                tratamientoId: item.tratamientoId,
                pieza: item.pieza,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                descuento: item.descuento,
                subtotal,
                estadoItem: item.estadoItem,
                fechaPropuesta: item.fechaPropuesta ? new Date(item.fechaPropuesta) : undefined,
                observaciones: item.observaciones,
              },
            });
          }

          await this._addHistorial(created.id, 'CREACION', 'Contrato creado', usuarioId, nombreUsuario, null, tx);

          return created;
        });

        return this.findById(contrato.id);
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('numero')) {
          retries--;
          lastError = err;
          // small random delay before retry to avoid immediate collision
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          continue;
        }
        throw err;
      }
    }
    
    throw new BadRequestError('No se pudo generar un número de contrato único. Por favor, intente de nuevo.');
  }

  async update(id: string, input: UpdateContratoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null) {
    const existing = await this.findById(id, clinicaId);

    if (existing.estado === 'COMPLETADO' || existing.estado === 'CANCELADO') {
      throw new BadRequestError(`No se puede editar un contrato en estado ${existing.estado}`);
    }

    const updateData: Prisma.ContratoUncheckedUpdateInput = {};
    if (input.pacienteId !== undefined) updateData.pacienteId = input.pacienteId;
    if (input.dentistaId !== undefined) updateData.dentistaId = input.dentistaId;
    if (input.clinicaId !== undefined) updateData.clinicaId = input.clinicaId;
    if (input.fecha !== undefined) updateData.fecha = new Date(input.fecha);
    if (input.descripcion !== undefined) updateData.descripcion = input.descripcion;
    if (input.moneda !== undefined) updateData.moneda = input.moneda;
    if (input.plazo !== undefined) updateData.plazo = input.plazo;
    if (input.periodicidad !== undefined) updateData.periodicidad = input.periodicidad;
    if (input.notas !== undefined) updateData.notas = input.notas;

    await prisma.contrato.update({
      where: { id },
      data: updateData,
    });

    await this._addHistorial(id, 'MODIFICACION', 'Contrato modificado', usuarioId, nombreUsuario, {
      before: {
        pacienteId: existing.pacienteId,
        dentistaId: existing.dentistaId,
        fecha: existing.fecha,
        descripcion: existing.descripcion,
        moneda: existing.moneda,
        plazo: existing.plazo,
        periodicidad: existing.periodicidad,
        notas: existing.notas,
      },
      after: input,
    });

    return this.findById(id, clinicaId);
  }

  async cambiarEstado(id: string, newEstado: string, usuarioId: number, nombreUsuario: string, clinicaId?: number | null) {
    const contrato = await this.findById(id, clinicaId);
    this._validateTransition(contrato.estado, newEstado);

    await prisma.contrato.update({
      where: { id },
      data: { estado: newEstado as PrismaEstadoContrato },
    });

    await this._addHistorial(
      id,
      'ESTADO_CAMBIADO',
      `Estado cambiado de ${contrato.estado} a ${newEstado}`,
      usuarioId,
      nombreUsuario,
      { from: contrato.estado, to: newEstado },
    );

    return this.findById(id, clinicaId);
  }

  async delete(id: string, clinicaId?: number | null): Promise<void> {
    const contrato = await this.findById(id, clinicaId);

    if (contrato.estado !== 'BORRADOR') {
      throw new BadRequestError('Solo se pueden eliminar contratos en estado BORRADOR');
    }

    await prisma.contrato.delete({ where: { id } });
  }

  async addTratamiento(contratoId: string, input: AddTratamientoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null) {
    const contrato = await this.findById(contratoId, clinicaId);

    if (contrato.estado === 'COMPLETADO' || contrato.estado === 'CANCELADO') {
      throw new BadRequestError(`No se puede modificar un contrato en estado ${contrato.estado}`);
    }

    const subtotal = this._computeSubtotal(input.precioUnitario, input.cantidad, input.descuento);

    const item = await prisma.contratoTratamiento.create({
      data: {
        contratoId,
        tratamientoId: input.tratamientoId,
        pieza: input.pieza,
        cantidad: input.cantidad,
        precioUnitario: input.precioUnitario,
        descuento: input.descuento,
        subtotal,
        estadoItem: input.estadoItem,
        fechaPropuesta: input.fechaPropuesta ? new Date(input.fechaPropuesta) : undefined,
        observaciones: input.observaciones,
      },
      include: { tratamiento: { select: { id: true, nombre: true, codigo: true } } },
    });

    await this._addHistorial(
      contratoId,
      'TRATAMIENTO_AGREGADO',
      `Tratamiento agregado: ${item.tratamiento.nombre}${input.pieza ? ` (${input.pieza})` : ''}`,
      usuarioId,
      nombreUsuario,
      { tratamientoId: input.tratamientoId },
    );

    return this.findById(contratoId, clinicaId);
  }

  async updateTratamientoItem(
    contratoId: string,
    itemId: string,
    input: UpdateTratamientoItemInput,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  ) {
    const contrato = await this.findById(contratoId, clinicaId);

    if (contrato.estado === 'COMPLETADO' || contrato.estado === 'CANCELADO') {
      throw new BadRequestError(`No se puede modificar un contrato en estado ${contrato.estado}`);
    }

    const existingItem = await prisma.contratoTratamiento.findFirst({
      where: { id: itemId, contratoId },
    });

    if (!existingItem) {
      throw new NotFoundError('ContratoTratamiento');
    }

    const precioUnitario = input.precioUnitario ?? Number(existingItem.precioUnitario);
    const cantidad = input.cantidad ?? existingItem.cantidad;
    const descuento = input.descuento ?? Number(existingItem.descuento);
    const subtotal = this._computeSubtotal(precioUnitario, cantidad, descuento);

    await prisma.contratoTratamiento.update({
      where: { id: itemId },
      data: {
        ...(input.tratamientoId !== undefined ? { tratamientoId: input.tratamientoId } : {}),
        ...(input.pieza !== undefined ? { pieza: input.pieza } : {}),
        ...(input.cantidad !== undefined ? { cantidad: input.cantidad } : {}),
        ...(input.precioUnitario !== undefined ? { precioUnitario: input.precioUnitario } : {}),
        ...(input.descuento !== undefined ? { descuento: input.descuento } : {}),
        subtotal,
        ...(input.estadoItem !== undefined ? { estadoItem: input.estadoItem } : {}),
        ...(input.fechaPropuesta !== undefined
          ? { fechaPropuesta: input.fechaPropuesta ? new Date(input.fechaPropuesta) : null }
          : {}),
        ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
      },
    });

    await this._addHistorial(
      contratoId,
      'TRATAMIENTO_MODIFICADO',
      `Tratamiento modificado: ${itemId}`,
      usuarioId,
      nombreUsuario,
      { itemId, changes: input },
    );

    return this.findById(contratoId, clinicaId);
  }

  async removeTratamiento(contratoId: string, itemId: string, usuarioId: number, nombreUsuario: string, clinicaId?: number | null) {
    const contrato = await this.findById(contratoId, clinicaId);

    if (contrato.estado === 'COMPLETADO' || contrato.estado === 'CANCELADO') {
      throw new BadRequestError(`No se puede modificar un contrato en estado ${contrato.estado}`);
    }

    const existingItem = await prisma.contratoTratamiento.findFirst({
      where: { id: itemId, contratoId },
    });

    if (!existingItem) {
      throw new NotFoundError('ContratoTratamiento');
    }

    await prisma.contratoTratamiento.delete({ where: { id: itemId } });

    await this._addHistorial(
      contratoId,
      'TRATAMIENTO_ELIMINADO',
      `Tratamiento eliminado: ${itemId}`,
      usuarioId,
      nombreUsuario,
      { itemId },
    );

    return this.findById(contratoId, clinicaId);
  }

  async registrarPago(contratoId: string, input: RegistrarPagoInput, usuarioId: number, nombreUsuario: string, clinicaId?: number | null) {
    const contrato = await this.findById(contratoId, clinicaId);

    if (contrato.estado === 'CANCELADO') {
      throw new BadRequestError('No se puede registrar un pago en un contrato cancelado');
    }

    await prisma.contratoPago.create({
      data: {
        contratoId,
        fecha: new Date(input.fecha),
        monto: input.monto,
        tipoPago: input.tipoPago,
        estado: 'APLICADO',
        concepto: input.concepto,
        referencia: input.referencia,
        numeroFactura: input.numeroFactura,
        autorizacion: input.autorizacion,
        notas: input.notas,
        registradoPorId: usuarioId,
      },
    });

    await this._addHistorial(
      contratoId,
      'PAGO_REGISTRADO',
      `Pago registrado: ${input.monto} ${contrato.moneda} (${input.tipoPago})`,
      usuarioId,
      nombreUsuario,
      { monto: input.monto, tipoPago: input.tipoPago },
    );

    return this.findById(contratoId, clinicaId);
  }

  async editarPago(
    contratoId: string,
    pagoId: string,
    input: EditarPagoInput,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  ) {
    const contrato = await this.findById(contratoId, clinicaId);
    if (contrato.estado === 'CANCELADO') {
      throw new BadRequestError('No se puede editar un pago en un contrato cancelado');
    }

    const pago = await prisma.contratoPago.findFirst({
      where: { id: pagoId, contratoId },
    });

    if (!pago) {
      throw new NotFoundError('ContratoPago');
    }

    if (pago.estado === 'ANULADO') {
      throw new BadRequestError('No se puede editar un pago anulado');
    }

    await prisma.contratoPago.update({
      where: { id: pagoId },
      data: {
        ...(input.fecha !== undefined ? { fecha: new Date(input.fecha) } : {}),
        ...(input.monto !== undefined ? { monto: input.monto } : {}),
        ...(input.tipoPago !== undefined ? { tipoPago: input.tipoPago } : {}),
        ...(input.concepto !== undefined ? { concepto: input.concepto } : {}),
        ...(input.referencia !== undefined ? { referencia: input.referencia } : {}),
        ...(input.numeroFactura !== undefined ? { numeroFactura: input.numeroFactura } : {}),
        ...(input.autorizacion !== undefined ? { autorizacion: input.autorizacion } : {}),
        ...(input.notas !== undefined ? { notas: input.notas } : {}),
      },
    });

    await this._addHistorial(
      contratoId,
      'MODIFICACION',
      `Pago modificado: ${pagoId}`,
      usuarioId,
      nombreUsuario,
      { pagoId, changes: input },
    );

    return this.findById(contratoId, clinicaId);
  }

  async anularPago(
    contratoId: string,
    pagoId: string,
    motivoAnulacion: string | undefined,
    usuarioId: number,
    nombreUsuario: string,
    clinicaId?: number | null,
  ) {
    const pago = await prisma.contratoPago.findFirst({
      where: { id: pagoId, contratoId },
      include: { contrato: { select: { moneda: true } } },
    });

    if (!pago) {
      throw new NotFoundError('ContratoPago');
    }

    if (pago.estado === 'ANULADO') {
      throw new BadRequestError('Este pago ya está anulado');
    }

    await prisma.contratoPago.update({
      where: { id: pagoId },
      data: {
        estado: 'ANULADO',
        motivoAnulacion: motivoAnulacion ?? null,
      },
    });

    await this._addHistorial(
      contratoId,
      'PAGO_ANULADO',
      `Pago anulado: ${pago.monto} ${pago.contrato.moneda}`,
      usuarioId,
      nombreUsuario,
      { monto: Number(pago.monto), motivoAnulacion },
    );

    return this.findById(contratoId, clinicaId);
  }

  async getHistorial(contratoId: string, clinicaId?: number | null) {
    await this.findById(contratoId, clinicaId);
    return prisma.contratoHistorial.findMany({
      where: { contratoId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const contratoService = new ContratoService();
