import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../auth';
import { featureService } from './feature.service';

export async function featureRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);
  fastify.addHook('onRequest', requireAdmin);

  // GET /features - List all active features
  fastify.get('/', async (request, reply) => {
    const features = await featureService.findAll();
    return reply.send({ success: true, data: features });
  });
}
