import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';

/**
 * ProfessionalService now queries the User model filtered by rol = 'MEDICO'.
 * The Professional model has been removed — professionals are users with the MEDICO role.
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
};

export class ProfessionalService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where = { rol: 'MEDICO' as const };

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

  async findActive(): Promise<unknown[]> {
    return prisma.user.findMany({
      where: { rol: 'MEDICO', estado: true },
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
