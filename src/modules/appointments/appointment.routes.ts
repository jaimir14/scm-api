import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { appointmentService } from './appointment.service';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentIdSchema,
  appointmentQuerySchema,
} from './appointment.schema';
import { AppError } from '../../common/errors';

export async function appointmentRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /appointments - List appointments (paginated, with filters)
  fastify.get('/', async (request, reply) => {
    const query = appointmentQuerySchema.parse(request.query);
    const result = await appointmentService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /appointments/:id - Get single appointment
  fastify.get('/:id', async (request, reply) => {
    const { id } = appointmentIdSchema.parse(request.params);
    const appointment = await appointmentService.findById(id);
    return reply.send({ success: true, data: appointment });
  });

  // POST /appointments - Create appointment
  fastify.post('/', async (request, reply) => {
    const input = createAppointmentSchema.parse(request.body);
    const appointment = await appointmentService.create(input);
    return reply.status(201).send({ success: true, data: appointment });
  });

  // PUT /appointments/:id - Update appointment
  fastify.put('/:id', async (request, reply) => {
    const { id } = appointmentIdSchema.parse(request.params);
    const input = updateAppointmentSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const appointment = await appointmentService.update(id, input);
    return reply.send({ success: true, data: appointment });
  });

  // PUT /appointments/:id/status - Update appointment status only
  fastify.put('/:id/status', async (request, reply) => {
    const { id } = appointmentIdSchema.parse(request.params);
    const input = updateAppointmentStatusSchema.parse(request.body);
    const appointment = await appointmentService.updateStatus(id, input);
    return reply.send({ success: true, data: appointment });
  });

  // DELETE /appointments/:id - Delete appointment
  fastify.delete('/:id', async (request, reply) => {
    const { id } = appointmentIdSchema.parse(request.params);
    await appointmentService.delete(id);
    return reply.status(204).send();
  });
}
