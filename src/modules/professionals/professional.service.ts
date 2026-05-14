import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';

const selectProfessionalFields = {
  id: true,
  nombre: true,
  especialidad: true,
  clinicaId: true,
  telefono: true,
  email: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  clinica: true,
  rol: { select: { id: true, nombre: true } },
};

function toResponse(user: Record<string, unknown>) {
  const { estado, ...rest } = user;
  return { ...rest, activo: estado };
}

export class ProfessionalService {
  async findAll(query: PaginationQuery, clinicaId?: number | null): Promise<PaginatedResponse<unknown>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { especialidad: { not: null } };
    if (clinicaId) where.clinicaId = clinicaId;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: selectProfessionalFields,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data.map(toResponse),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActive(clinicaId?: number | null): Promise<unknown[]> {
    const where: Record<string, unknown> = { especialidad: { not: null }, estado: true };
    if (clinicaId) where.clinicaId = clinicaId;
    const data = await prisma.user.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: selectProfessionalFields,
    });
    return data.map(toResponse);
  }

  async findById(id: number): Promise<unknown> {
    const professional = await prisma.user.findUnique({
      where: { id },
      select: selectProfessionalFields,
    });
    if (!professional || professional.clinicaId === null) {
      throw new NotFoundError('Professional');
    }
    return toResponse(professional as Record<string, unknown>);
  }
}

export const professionalService = new ProfessionalService();
