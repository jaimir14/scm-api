import { prisma } from '../../database';

export class FeatureService {
  async findAll() {
    return prisma.feature.findMany({
      where: { activo: true },
      orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }],
    });
  }
}

export const featureService = new FeatureService();
