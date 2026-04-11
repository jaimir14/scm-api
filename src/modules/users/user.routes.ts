import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { userService } from './user.service';
import { createUserSchema, updateUserSchema, userIdSchema } from './user.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';
import { generateUploadUrl, generateViewUrl, deleteObject } from '../../lib/s3';
import { env } from '../../config';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

const userPhotoUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1).refine(v => v.startsWith('image/'), 'Solo se permiten imagenes'),
  fileSize: z.number().int().positive().max(MAX_IMAGE_SIZE, 'La imagen no puede superar 20MB'),
});

export async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /users - List all users (paginated)
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const result = await userService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /users/:id - Get a single user
  fastify.get('/:id', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    const user = await userService.findById(id);
    return reply.send({ success: true, data: user });
  });

  // POST /users - Create a new user
  fastify.post('/', async (request, reply) => {
    const input = createUserSchema.parse(request.body);
    const user = await userService.create(input);
    return reply.status(201).send({ success: true, data: user });
  });

  // PUT /users/:id - Update a user
  fastify.put('/:id', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    const input = updateUserSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const user = await userService.update(id, input);
    return reply.send({ success: true, data: user });
  });

  // DELETE /users/:id - Delete a user
  fastify.delete('/:id', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    await userService.delete(id);
    return reply.status(204).send();
  });

  // POST /users/:id/photo/presigned-url - Get presigned upload URL for user photo
  fastify.post('/:id/photo/presigned-url', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    const { fileName, mimeType, fileSize } = userPhotoUploadSchema.parse(request.body);

    if (!env.SPACES_BUCKET) {
      throw new AppError('Storage is not configured', 500);
    }

    const user = await userService.findById(id);
    const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const uniqueName = `${randomUUID()}${ext}`;
    const storagePath = `users/${id}/${uniqueName}`;

    const uploadUrl = await generateUploadUrl(env.SPACES_BUCKET, storagePath, mimeType);

    return reply.send({ success: true, data: { uploadUrl, storagePath } });
  });

  // PUT /users/:id/photo - Register photo after upload
  fastify.put('/:id/photo', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);
    const { storagePath } = z.object({ storagePath: z.string().min(1) }).parse(request.body);

    const user = await userService.update(id, { fotografia: storagePath });
    return reply.send({ success: true, data: user });
  });

  // GET /users/:id/photo/view-url - Get presigned view URL for user photo
  fastify.get('/:id/photo/view-url', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);

    if (!env.SPACES_BUCKET) {
      throw new AppError('Storage is not configured', 500);
    }

    const user = await userService.findById(id);
    if (!user.fotografia) {
      return reply.send({ success: true, data: { viewUrl: null } });
    }

    const viewUrl = await generateViewUrl(env.SPACES_BUCKET, user.fotografia);
    return reply.send({ success: true, data: { viewUrl } });
  });

  // DELETE /users/:id/photo - Delete user photo
  fastify.delete('/:id/photo', async (request, reply) => {
    const { id } = userIdSchema.parse(request.params);

    if (!env.SPACES_BUCKET) {
      throw new AppError('Storage is not configured', 500);
    }

    const user = await userService.findById(id);
    if (user.fotografia) {
      await deleteObject(env.SPACES_BUCKET, user.fotografia);
      await userService.update(id, { fotografia: null });
    }

    return reply.status(204).send();
  });
}
