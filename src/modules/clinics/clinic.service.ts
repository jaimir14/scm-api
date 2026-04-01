import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse } from '../../common/schemas';
import { CreateClinicInput, UpdateClinicInput, ClinicQuery } from './clinic.schema';

type Clinic = Awaited<ReturnType<typeof prisma.clinic.findFirstOrThrow>>;

export class ClinicService {
  async findAll(query: ClinicQuery): Promise<PaginatedResponse<Clinic>> {
    const { page, limit, estado } = query;
    const skip = (page - 1) * limit;

    const where = estado !== undefined ? { estado } : {};

    const [data, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clinic.count({ where }),
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

  async findActive(): Promise<Clinic[]> {
    return prisma.clinic.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: number): Promise<Clinic> {
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      throw new NotFoundError('Clinic');
    }
    return clinic;
  }

  async create(input: CreateClinicInput): Promise<Clinic> {
    return prisma.clinic.create({ data: input });
  }

  async update(id: number, input: UpdateClinicInput): Promise<Clinic> {
    await this.findById(id);
    return prisma.clinic.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.clinic.delete({ where: { id } });
  }
}

export const clinicService = new ClinicService();
