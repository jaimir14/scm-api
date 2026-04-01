import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreateAppointmentTypeInput, UpdateAppointmentTypeInput } from './appointment-type.schema';

type AppointmentType = Awaited<ReturnType<typeof prisma.appointmentType.findFirstOrThrow>>;

export class AppointmentTypeService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<AppointmentType>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.appointmentType.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointmentType.count(),
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

  async findActive(): Promise<AppointmentType[]> {
    return prisma.appointmentType.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: number): Promise<AppointmentType> {
    const appointmentType = await prisma.appointmentType.findUnique({ where: { id } });
    if (!appointmentType) {
      throw new NotFoundError('AppointmentType');
    }
    return appointmentType;
  }

  async create(input: CreateAppointmentTypeInput): Promise<AppointmentType> {
    return prisma.appointmentType.create({ data: input });
  }

  async update(id: number, input: UpdateAppointmentTypeInput): Promise<AppointmentType> {
    await this.findById(id);
    return prisma.appointmentType.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.appointmentType.delete({ where: { id } });
  }
}

export const appointmentTypeService = new AppointmentTypeService();
