import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { treatmentService } from './treatment.service';
import { createTreatmentSchema, updateTreatmentSchema, treatmentIdSchema, treatmentQuerySchema } from './treatment.schema';
import { AppError } from '../../common/errors';
import { logFromRequest } from '../audit-log';

export async function treatmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /treatments - List all treatments (paginated, filter by categoria)
  fastify.get('/', async (request, reply) => {
    const query = treatmentQuerySchema.parse(request.query);
    const result = await treatmentService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /treatments/active - Active treatments for dropdowns
  fastify.get('/active', async (request, reply) => {
    const data = await treatmentService.findActive();
    return reply.send({ success: true, data });
  });

  // GET /treatments/:id - Get single treatment
  fastify.get('/:id', async (request, reply) => {
    const { id } = treatmentIdSchema.parse(request.params);
    const treatment = await treatmentService.findById(id);
    return reply.send({ success: true, data: treatment });
  });

  // POST /treatments - Create treatment
  fastify.post('/', async (request, reply) => {
    const input = createTreatmentSchema.parse(request.body);
    const treatment = await treatmentService.create(input);
    logFromRequest(request, 'CREACION', 'Tratamientos', `Tratamiento creado: ${input.nombre}`);
    return reply.status(201).send({ success: true, data: treatment });
  });

  // PUT /treatments/:id - Update treatment
  fastify.put('/:id', async (request, reply) => {
    const { id } = treatmentIdSchema.parse(request.params);
    const input = updateTreatmentSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const treatment = await treatmentService.update(id, input);
    logFromRequest(request, 'ACTUALIZACION', 'Tratamientos', `Tratamiento actualizado: ID ${id}`);
    return reply.send({ success: true, data: treatment });
  });

  // DELETE /treatments/:id - Delete treatment
  fastify.delete('/:id', async (request, reply) => {
    const { id } = treatmentIdSchema.parse(request.params);
    await treatmentService.delete(id);
    logFromRequest(request, 'ELIMINACION', 'Tratamientos', `Tratamiento eliminado: ID ${id}`);
    return reply.status(204).send();
  });
}
