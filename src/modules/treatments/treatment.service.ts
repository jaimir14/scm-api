import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse } from '../../common/schemas';
import { CreateTreatmentInput, UpdateTreatmentInput, TreatmentQuery } from './treatment.schema';

type Treatment = Awaited<ReturnType<typeof prisma.treatment.findFirstOrThrow>>;

export class TreatmentService {
  async findAll(query: TreatmentQuery): Promise<PaginatedResponse<Treatment>> {
    const { page, limit, categoria } = query;
    const skip = (page - 1) * limit;

    const where = categoria ? { categoria } : {};

    const [data, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.treatment.count({ where }),
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

  async findActive(): Promise<Treatment[]> {
    return prisma.treatment.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: number): Promise<Treatment> {
    const treatment = await prisma.treatment.findUnique({ where: { id } });
    if (!treatment) {
      throw new NotFoundError('Treatment');
    }
    return treatment;
  }

  async create(input: CreateTreatmentInput): Promise<Treatment> {
    return prisma.treatment.create({ data: input });
  }

  async update(id: number, input: UpdateTreatmentInput): Promise<Treatment> {
    await this.findById(id);
    return prisma.treatment.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.treatment.delete({ where: { id } });
  }
}

export const treatmentService = new TreatmentService();
