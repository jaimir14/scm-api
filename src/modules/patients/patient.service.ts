import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse } from '../../common/schemas';
import { CreatePatientInput, UpdatePatientInput, PatientSearchQuery, PatientListQuery } from './patient.schema';

type Patient = Awaited<ReturnType<typeof prisma.patient.findFirstOrThrow>>;

const includeRelations = {
  clinica: true,
  profesional: {
    select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true },
  },
};

export class PatientService {
  async findAll(query: PatientListQuery, clinicaId?: number | null): Promise<PaginatedResponse<Patient>> {
    const { q, type, page, limit } = query;
    const skip = (page - 1) * limit;

    const clinicFilter = clinicaId ? { clinicaId } : {};
    const searchFilter = this._buildSearchFilter(q, type);
    const where = { ...clinicFilter, ...searchFilter };

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ apellido1: 'asc' }, { apellido2: 'asc' }, { nombre: 'asc' }],
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

  private _buildSearchFilter(q: string, type: string) {
    if (!q) return {};
    if (type === 'cedula') {
      return { numeroIdentificacion: { contains: q } };
    }
    return {
      OR: [
        { nombre: { contains: q } },
        { apellido1: { contains: q } },
        { apellido2: { contains: q } },
      ],
    };
  }

  async search(query: PatientSearchQuery, clinicaId?: number | null): Promise<PaginatedResponse<Patient>> {
    return this.findAll(query, clinicaId);
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
