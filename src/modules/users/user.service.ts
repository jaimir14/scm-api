import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreateUserInput, UpdateUserInput } from './user.schema';
import { hashPassword } from '../auth/password.utils';

type User = Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;

const includeRelations = {
  clinica: true,
  rol: true,
};

// Omit passwordHash from responses and flatten role name
function formatUser(user: any): Omit<any, 'passwordHash'> {
  const { passwordHash: _, rol: rolRelation, ...rest } = user;
  return {
    ...rest,
    rol: rolRelation?.nombre ?? null,
    esAdmin: rolRelation?.esAdmin ?? false,
  };
}

export class UserService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeRelations,
      }),
      prisma.user.count(),
    ]);

    return {
      data: data.map(formatUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    return formatUser(user);
  }

  async findByUsuario(usuario: string) {
    return prisma.user.findUnique({
      where: { usuario },
      include: includeRelations,
    });
  }

  async create(input: CreateUserInput) {
    const { password, ...rest } = input;
    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash: await hashPassword(password),
      },
      include: includeRelations,
    });
    return formatUser(user);
  }

  async update(id: number, input: UpdateUserInput) {
    // Verify exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    const { password, ...rest } = input;
    const data: any = { ...rest };
    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: includeRelations,
    });
    return formatUser(user);
  }

  async delete(id: number): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }
    await prisma.user.delete({ where: { id } });
  }

  async findDoctors(clinicaId?: number | null) {
    const DOCTOR_FEATURE_KEYS = ['doctor.dashboard', 'doctor.agenda', 'doctor.pacientes'];

    // Find role IDs that have any Portal Médico feature assigned
    const roleFeatures = await prisma.roleFeature.findMany({
      where: {
        feature: { clave: { in: DOCTOR_FEATURE_KEYS } },
      },
      select: { rolId: true },
    });

    const rolIds = [...new Set(roleFeatures.map(rf => rf.rolId))];
    if (rolIds.length === 0) return [];

    const users = await prisma.user.findMany({
      where: {
        estado: true,
        rolId: { in: rolIds },
        rol: { activo: true },
        ...(clinicaId ? { clinicaId } : {}),
      },
      orderBy: { nombre: 'asc' },
      include: includeRelations,
    });

    return users.map(formatUser);
  }

  async updateLastAccess(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    });
  }
}

export const userService = new UserService();
