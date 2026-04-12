import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';

/**
 * ProfessionalService queries the User model filtered by role name containing 'Médico' or similar.
 * With dynamic roles, we look for users whose role is typically a doctor-type role.
 * We filter by the role relation instead of a hardcoded enum.
 */

const selectProfessionalFields = {
  id: true,
  nombre: true,
  especialidad: true,
  clinicaId: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  clinica: true,
  rol: { select: { id: true, nombre: true } },
};

export class ProfessionalService {
  async findAll(query: PaginationQuery, clinicaId?: number | null): Promise<PaginatedResponse<unknown>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where: any = { especialidad: { not: null } };
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
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActive(clinicaId?: number | null): Promise<unknown[]> {
    const where: any = { especialidad: { not: null }, estado: true };
    if (clinicaId) where.clinicaId = clinicaId;
    return prisma.user.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: selectProfessionalFields,
    });
  }

  async findById(id: number): Promise<unknown> {
    const professional = await prisma.user.findUnique({
      where: { id },
      select: selectProfessionalFields,
    });
    if (!professional || professional.clinicaId === null) {
      throw new NotFoundError('Professional');
    }
    return professional;
  }
}

export const professionalService = new ProfessionalService();
