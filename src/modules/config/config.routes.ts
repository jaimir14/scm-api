import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { configService } from './config.service';
import { updateConfigSchema } from './config.schema';
import { AppError } from '../../common/errors';

export async function configRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /config - Get system configuration
  fastify.get('/', async (request, reply) => {
    const config = await configService.get();
    return reply.send({ success: true, data: config });
  });

  // PUT /config - Update system configuration
  fastify.put('/', async (request, reply) => {
    const input = updateConfigSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const config = await configService.update(input);
    return reply.send({ success: true, data: config });
  });
}
