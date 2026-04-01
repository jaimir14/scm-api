import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { auditLogService } from './audit-log.service';
import { auditLogQuerySchema } from './audit-log.schema';

export async function auditLogRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /audit-log - List audit log entries (paginated, with filters)
  fastify.get('/', async (request, reply) => {
    const query = auditLogQuerySchema.parse(request.query);
    const result = await auditLogService.findAll(query);
    return reply.send({ success: true, ...result });
  });
}
