import bcrypt from 'bcryptjs';
import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreateUserInput, UpdateUserInput } from './user.schema';

type User = Awaited<ReturnType<typeof prisma.user.findFirstOrThrow>>;

// Omit password from responses
function omitPassword(user: User): Omit<User, 'password'> {
  const { password: _, ...rest } = user;
  return rest;
}

export class UserService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { clinica: true },
      }),
      prisma.user.count(),
    ]);

    return {
      data: data.map(omitPassword),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { clinica: true },
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    return omitPassword(user);
  }

  async findByUsuario(usuario: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { usuario } });
  }

  async create(input: CreateUserInput): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        ...input,
        password: hashedPassword,
      },
      include: { clinica: true },
    });
    return omitPassword(user);
  }

  async update(id: number, input: UpdateUserInput): Promise<Omit<User, 'password'>> {
    await this.findById(id);

    const data: UpdateUserInput = { ...input };
    if (input.password) {
      data.password = await bcrypt.hash(input.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { clinica: true },
    });
    return omitPassword(user);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await prisma.user.delete({ where: { id } });
  }

  async updateLastAccess(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    });
  }
}

export const userService = new UserService();
