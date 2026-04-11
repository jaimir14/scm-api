import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { consultationImageService } from './consultation-image.service';
import {
  presignedUrlSchema,
  registerImageSchema,
  consultationIdParamSchema,
  imageIdParamSchema,
} from './consultation-image.schema';

export async function consultationImageRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // POST /consultation-images/presigned-url - Get a presigned upload URL
  fastify.post('/presigned-url', async (request, reply) => {
    const input = presignedUrlSchema.parse(request.body);
    const result = await consultationImageService.getPresignedUploadUrl(input);
    return reply.send({ success: true, data: result });
  });

  // POST /consultation-images - Register an uploaded image
  fastify.post('/', async (request, reply) => {
    const input = registerImageSchema.parse(request.body);
    const image = await consultationImageService.register(input);
    return reply.status(201).send({ success: true, data: image });
  });

  // GET /consultation-images/consultation/:consultaId - List images for a consultation
  fastify.get('/consultation/:consultaId', async (request, reply) => {
    const { consultaId } = consultationIdParamSchema.parse(request.params);
    const images = await consultationImageService.findByConsultation(consultaId);
    return reply.send({ success: true, data: images });
  });

  // GET /consultation-images/:id/view-url - Get a presigned view URL
  fastify.get('/:id/view-url', async (request, reply) => {
    const { id } = imageIdParamSchema.parse(request.params);
    const result = await consultationImageService.getViewUrl(id);
    return reply.send({ success: true, data: result });
  });

  // DELETE /consultation-images/:id - Delete an image
  fastify.delete('/:id', async (request, reply) => {
    const { id } = imageIdParamSchema.parse(request.params);
    await consultationImageService.delete(id);
    return reply.status(204).send();
  });
}
