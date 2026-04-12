import { prisma } from '../../database';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { PaginatedResponse, PaginationQuery } from '../../common/schemas';
import { CreateRoleInput, UpdateRoleInput } from './role.schema';

const includeRelations = {
  features: {
    include: { feature: true },
  },
  _count: { select: { users: true } },
};

type Role = Awaited<ReturnType<typeof prisma.role.findFirstOrThrow>>;

export class RoleService {
  async findAll(query: PaginationQuery): Promise<PaginatedResponse<any>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeRelations,
      }),
      prisma.role.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!role) {
      throw new NotFoundError('Role');
    }
    return role;
  }

  async create(input: CreateRoleInput) {
    if (input.esAdmin) {
      const existingAdmin = await prisma.role.findFirst({ where: { esAdmin: true } });
      if (existingAdmin) {
        throw new BadRequestError('Ya existe un rol con permisos de administrador');
      }
    }

    return prisma.role.create({
      data: input,
      include: includeRelations,
    });
  }

  async update(id: number, input: UpdateRoleInput) {
    const role = await this.findById(id);

    // Cannot deactivate the admin role
    if (role.esAdmin && input.activo === false) {
      throw new BadRequestError('No se puede desactivar el rol de administrador');
    }

    // Cannot set esAdmin=true if another admin role already exists
    if (input.esAdmin === true && !role.esAdmin) {
      const existingAdmin = await prisma.role.findFirst({ where: { esAdmin: true } });
      if (existingAdmin) {
        throw new BadRequestError('Ya existe un rol con permisos de administrador');
      }
    }

    // Cannot remove esAdmin from the admin role
    if (role.esAdmin && input.esAdmin === false) {
      throw new BadRequestError('No se puede quitar el permiso de administrador al rol de admin');
    }

    return prisma.role.update({
      where: { id },
      data: input,
      include: includeRelations,
    });
  }

  async delete(id: number): Promise<void> {
    const role = await this.findById(id);

    if (role.esAdmin) {
      throw new BadRequestError('No se puede eliminar el rol de administrador');
    }

    await prisma.role.delete({ where: { id } });
  }

  async getFeatureKeys(id: number): Promise<string[]> {
    const role = await this.findById(id);
    const roleFeatures = await prisma.roleFeature.findMany({
      where: { rolId: id },
      include: { feature: true },
    });
    return roleFeatures.map(rf => rf.feature.clave);
  }

  async syncFeatures(id: number, featureKeys: string[]): Promise<string[]> {
    await this.findById(id);

    // Resolve feature IDs from keys
    const features = await prisma.feature.findMany({
      where: { clave: { in: featureKeys } },
    });

    const foundKeys = features.map(f => f.clave);
    const missingKeys = featureKeys.filter(k => !foundKeys.includes(k));
    if (missingKeys.length > 0) {
      throw new BadRequestError(`Features no encontrados: ${missingKeys.join(', ')}`);
    }

    // Delete existing and insert new in a transaction
    await prisma.$transaction([
      prisma.roleFeature.deleteMany({ where: { rolId: id } }),
      prisma.roleFeature.createMany({
        data: features.map(f => ({ rolId: id, featureId: f.id })),
      }),
    ]);

    return featureKeys;
  }
}

export const roleService = new RoleService();
