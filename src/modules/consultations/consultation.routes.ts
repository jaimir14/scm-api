import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { consultationService } from './consultation.service';
import {
  createConsultationSchema,
  updateConsultationSchema,
  consultationIdSchema,
  patientIdParamSchema,
} from './consultation.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';

export async function consultationRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /consultations - List all consultations (paginated)
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const result = await consultationService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /consultations/:id - Get single consultation
  fastify.get('/:id', async (request, reply) => {
    const { id } = consultationIdSchema.parse(request.params);
    const consultation = await consultationService.findById(id);
    return reply.send({ success: true, data: consultation });
  });

  // POST /consultations - Create consultation
  fastify.post('/', async (request, reply) => {
    const input = createConsultationSchema.parse(request.body);
    const consultation = await consultationService.create(input);
    return reply.status(201).send({ success: true, data: consultation });
  });

  // PUT /consultations/:id - Update consultation
  fastify.put('/:id', async (request, reply) => {
    const { id } = consultationIdSchema.parse(request.params);
    const input = updateConsultationSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const consultation = await consultationService.update(id, input);
    return reply.send({ success: true, data: consultation });
  });

  // DELETE /consultations/:id - Delete consultation
  fastify.delete('/:id', async (request, reply) => {
    const { id } = consultationIdSchema.parse(request.params);
    await consultationService.delete(id);
    return reply.status(204).send();
  });
}

// Separate route handler for patient-scoped consultations
export async function patientConsultationRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /patients/:patientId/consultations - List consultations by patient
  fastify.get('/', async (request, reply) => {
    const { patientId } = patientIdParamSchema.parse(request.params);
    const query = paginationSchema.parse(request.query);
    const result = await consultationService.findByPatient(patientId, query);
    return reply.send({ success: true, ...result });
  });
}
