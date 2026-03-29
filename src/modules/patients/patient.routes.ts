import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { patientService } from './patient.service';
import { createPatientSchema, updatePatientSchema, patientIdSchema } from './patient.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';

export async function patientRoutes(fastify: FastifyInstance) {
  // All patient routes require authentication
  fastify.addHook('onRequest', authenticate);

  // GET /patients - List all patients (paginated)
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const result = await patientService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /patients/:id - Get a single patient
  fastify.get('/:id', async (request, reply) => {
    const { id } = patientIdSchema.parse(request.params);
    const patient = await patientService.findById(id);
    return reply.send({ success: true, data: patient });
  });

  // POST /patients - Create a new patient
  fastify.post('/', async (request, reply) => {
    const input = createPatientSchema.parse(request.body);
    const patient = await patientService.create(input);
    return reply.status(201).send({ success: true, data: patient });
  });

  // PUT /patients/:id - Update a patient
  fastify.put('/:id', async (request, reply) => {
    const { id } = patientIdSchema.parse(request.params);
    const input = updatePatientSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const patient = await patientService.update(id, input);
    return reply.send({ success: true, data: patient });
  });

  // DELETE /patients/:id - Delete a patient
  fastify.delete('/:id', async (request, reply) => {
    const { id } = patientIdSchema.parse(request.params);
    await patientService.delete(id);
    return reply.status(204).send();
  });
}
