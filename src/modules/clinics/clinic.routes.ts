import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { clinicService } from './clinic.service';
import { createClinicSchema, updateClinicSchema, clinicIdSchema, clinicQuerySchema } from './clinic.schema';
import { AppError } from '../../common/errors';
import { logFromRequest } from '../audit-log';

export async function clinicRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /clinics - List all clinics (paginated, filter by estado)
  fastify.get('/', async (request, reply) => {
    const query = clinicQuerySchema.parse(request.query);
    const result = await clinicService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /clinics/active - Active clinics for dropdowns
  fastify.get('/active', async (request, reply) => {
    const data = await clinicService.findActive();
    return reply.send({ success: true, data });
  });

  // GET /clinics/:id - Get a single clinic
  fastify.get('/:id', async (request, reply) => {
    const { id } = clinicIdSchema.parse(request.params);
    const clinic = await clinicService.findById(id);
    return reply.send({ success: true, data: clinic });
  });

  // POST /clinics - Create a new clinic
  fastify.post('/', async (request, reply) => {
    const input = createClinicSchema.parse(request.body);
    const clinic = await clinicService.create(input);
    logFromRequest(request, 'CREACION', 'Clínicas', `Clínica creada: ${input.nombre}`);
    return reply.status(201).send({ success: true, data: clinic });
  });

  // PUT /clinics/:id - Update a clinic
  fastify.put('/:id', async (request, reply) => {
    const { id } = clinicIdSchema.parse(request.params);
    const input = updateClinicSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const clinic = await clinicService.update(id, input);
    logFromRequest(request, 'ACTUALIZACION', 'Clínicas', `Clínica actualizada: ID ${id}`);
    return reply.send({ success: true, data: clinic });
  });

  // DELETE /clinics/:id - Delete a clinic
  fastify.delete('/:id', async (request, reply) => {
    const { id } = clinicIdSchema.parse(request.params);
    await clinicService.delete(id);
    logFromRequest(request, 'ELIMINACION', 'Clínicas', `Clínica eliminada: ID ${id}`);
    return reply.status(204).send();
  });
}
