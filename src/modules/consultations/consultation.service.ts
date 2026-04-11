import { prisma } from '../../database';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreateConsultationInput, UpdateConsultationInput } from './consultation.schema';

type Consultation = Awaited<ReturnType<typeof prisma.consultation.findFirstOrThrow>>;

const includeRelations = {
  paciente: true,
  profesional: {
    select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
  },
};

export class ConsultationService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<Consultation>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.consultation.findMany({
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: includeRelations,
      }),
      prisma.consultation.count(),
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

  async findByPatient(patientId: number, query: PaginationQuery): Promise<PaginatedResponse<Consultation>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where = { pacienteId: patientId };

    const [data, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: includeRelations,
      }),
      prisma.consultation.count({ where }),
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

  async findById(id: number): Promise<Consultation> {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }
    return consultation;
  }

  async create(input: CreateConsultationInput): Promise<Consultation> {
    if (input.citaId) {
      const existing = await prisma.consultation.findUnique({
        where: { citaId: input.citaId },
      });

      if (existing) {
        throw new BadRequestError('Ya existe una consulta para esta cita');
      }
    }

    return prisma.consultation.create({
      data: input,
      include: includeRelations,
    });
  }

  async update(id: number, input: UpdateConsultationInput): Promise<Consultation> {
    await this.findById(id);
    return prisma.consultation.update({
      where: { id },
      data: input,
      include: includeRelations,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.consultation.delete({ where: { id } });
  }
}

export const consultationService = new ConsultationService();
