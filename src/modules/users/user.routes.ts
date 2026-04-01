import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { userService } from './user.service';
import { createUserSchema, updateUserSchema, userIdSchema } from './user.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';

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
}
