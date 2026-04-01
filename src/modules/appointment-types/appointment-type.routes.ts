import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { appointmentTypeService } from './appointment-type.service';
import { createAppointmentTypeSchema, updateAppointmentTypeSchema, appointmentTypeIdSchema } from './appointment-type.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';

export async function appointmentTypeRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /appointment-types - List all (paginated)
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const result = await appointmentTypeService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /appointment-types/active - Active types for dropdowns
  fastify.get('/active', async (request, reply) => {
    const data = await appointmentTypeService.findActive();
    return reply.send({ success: true, data });
  });

  // GET /appointment-types/:id - Get single
  fastify.get('/:id', async (request, reply) => {
    const { id } = appointmentTypeIdSchema.parse(request.params);
    const appointmentType = await appointmentTypeService.findById(id);
    return reply.send({ success: true, data: appointmentType });
  });

  // POST /appointment-types - Create
  fastify.post('/', async (request, reply) => {
    const input = createAppointmentTypeSchema.parse(request.body);
    const appointmentType = await appointmentTypeService.create(input);
    return reply.status(201).send({ success: true, data: appointmentType });
  });

  // PUT /appointment-types/:id - Update
  fastify.put('/:id', async (request, reply) => {
    const { id } = appointmentTypeIdSchema.parse(request.params);
    const input = updateAppointmentTypeSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const appointmentType = await appointmentTypeService.update(id, input);
    return reply.send({ success: true, data: appointmentType });
  });

  // DELETE /appointment-types/:id - Delete
  fastify.delete('/:id', async (request, reply) => {
    const { id } = appointmentTypeIdSchema.parse(request.params);
    await appointmentTypeService.delete(id);
    return reply.status(204).send();
  });
}
