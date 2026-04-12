import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { professionalService } from './professional.service';
import { professionalIdSchema } from './professional.schema';
import { paginationSchema } from '../../common/schemas';
import { getClinicScope } from '../../common/helpers/clinic-scope';

export async function professionalRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /professionals - List all professionals (users with MEDICO role), paginated
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const clinicaId = getClinicScope(request);
    const result = await professionalService.findAll(query, clinicaId);
    return reply.send({ success: true, ...result });
  });

  // GET /professionals/active - Active professionals for dropdowns
  fastify.get('/active', async (request, reply) => {
    const clinicaId = getClinicScope(request);
    const data = await professionalService.findActive(clinicaId);
    return reply.send({ success: true, data });
  });

  // GET /professionals/:id - Get a single professional
  fastify.get('/:id', async (request, reply) => {
    const { id } = professionalIdSchema.parse(request.params);
    const professional = await professionalService.findById(id);
    return reply.send({ success: true, data: professional });
  });
}
