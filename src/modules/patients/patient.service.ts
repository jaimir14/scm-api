import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreatePatientInput, UpdatePatientInput, PatientSearchQuery } from './patient.schema';

type Patient = Awaited<ReturnType<typeof prisma.patient.findFirstOrThrow>>;

const includeRelations = {
  clinica: true,
  profesional: {
    select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
  },
};

export class PatientService {
  async findAll(query: PaginationQuery, clinicaId?: number | null): Promise<PaginatedResponse<Patient>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where = clinicaId ? { clinicaId } : {};

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeRelations,
      }),
      prisma.patient.count({ where }),
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

  async search(query: PatientSearchQuery, clinicaId?: number | null): Promise<Patient[]> {
    const { q, type } = query;

    const clinicFilter = clinicaId ? { clinicaId } : {};

    if (type === 'cedula') {
      return prisma.patient.findMany({
        where: {
          ...clinicFilter,
          numeroIdentificacion: { contains: q },
        },
        include: includeRelations,
        take: 20,
        orderBy: { nombre: 'asc' },
      });
    }

    // Search by nombre (first name + last names)
    return prisma.patient.findMany({
      where: {
        ...clinicFilter,
        OR: [
          { nombre: { contains: q } },
          { apellido1: { contains: q } },
          { apellido2: { contains: q } },
        ],
      },
      include: includeRelations,
      take: 20,
      orderBy: { nombre: 'asc' },
    });
  }

  async findById(id: number): Promise<Patient> {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!patient) {
      throw new NotFoundError('Patient');
    }
    return patient;
  }

  async findByProfessional(profesionalId: number): Promise<Patient[]> {
    // Get patients assigned to this professional
    const assigned = await prisma.patient.findMany({
      where: { profesionalId },
      include: includeRelations,
      orderBy: { nombre: 'asc' },
    });

    // Get patients who have had appointments with this professional
    const fromAppointments = await prisma.patient.findMany({
      where: {
        appointments: {
          some: { profesionalId },
        },
        NOT: { profesionalId },
      },
      include: includeRelations,
      orderBy: { nombre: 'asc' },
    });

    return [...assigned, ...fromAppointments];
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    return prisma.patient.create({
      data: input,
      include: includeRelations,
    });
  }

  async update(id: number, input: UpdatePatientInput): Promise<Patient> {
    await this.findById(id);
    return prisma.patient.update({
      where: { id },
      data: input,
      include: includeRelations,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.patient.delete({ where: { id } });
  }
}

export const patientService = new PatientService();
