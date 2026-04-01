import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse } from '../../common/schemas';
import { CreateAppointmentInput, UpdateAppointmentInput, UpdateAppointmentStatusInput, AppointmentQuery } from './appointment.schema';

type Appointment = Awaited<ReturnType<typeof prisma.appointment.findFirstOrThrow>>;

const includeRelations = {
  paciente: true,
  profesional: {
    select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
  },
  tipoCita: true,
};

export class AppointmentService {
  async findAll(query: AppointmentQuery): Promise<PaginatedResponse<Appointment>> {
    const { page, limit, fecha, profesionalId, clinicaId, estado } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {};
    if (fecha) {
      const dateStart = new Date(fecha);
      const dateEnd = new Date(fecha);
      dateEnd.setDate(dateEnd.getDate() + 1);
      where.fecha = { gte: dateStart, lt: dateEnd };
    }
    if (profesionalId) {
      where.profesionalId = profesionalId;
    }
    if (clinicaId) {
      where.profesional = { clinicaId };
    }
    if (estado) {
      where.estado = estado;
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        include: includeRelations,
      }),
      prisma.appointment.count({ where }),
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

  async findById(id: number): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!appointment) {
      throw new NotFoundError('Appointment');
    }
    return appointment;
  }

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    return prisma.appointment.create({
      data: input,
      include: includeRelations,
    });
  }

  async update(id: number, input: UpdateAppointmentInput): Promise<Appointment> {
    await this.findById(id);
    return prisma.appointment.update({
      where: { id },
      data: input,
      include: includeRelations,
    });
  }

  async updateStatus(id: number, input: UpdateAppointmentStatusInput): Promise<Appointment> {
    await this.findById(id);
    return prisma.appointment.update({
      where: { id },
      data: { estado: input.estado },
      include: includeRelations,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.appointment.delete({ where: { id } });
  }

  async findUpcomingToday(limit: number = 5): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.findMany({
      where: {
        fecha: { gte: today, lt: tomorrow },
        estado: 'PENDIENTE',
      },
      orderBy: { horaInicio: 'asc' },
      take: limit,
      include: includeRelations,
    });
  }
}

export const appointmentService = new AppointmentService();
