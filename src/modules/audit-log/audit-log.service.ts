import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { PaginatedResponse } from '../../common/schemas';
import { AuditLogQuery } from './audit-log.schema';

type AuditLog = Awaited<ReturnType<typeof prisma.auditLog.findFirstOrThrow>>;

export class AuditLogService {
  async findAll(query: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
    const { page, limit, fechaDesde, fechaHasta, usuarioId, modulo, accion } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) {
        where.fecha.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const end = new Date(fechaHasta);
        end.setDate(end.getDate() + 1);
        where.fecha.lt = end;
      }
    }
    if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    if (modulo) {
      where.modulo = modulo;
    }
    if (accion) {
      where.accion = accion;
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRecent(limit: number = 10): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { fecha: 'desc' },
      take: limit,
    });
  }
}

export const auditLogService = new AuditLogService();
