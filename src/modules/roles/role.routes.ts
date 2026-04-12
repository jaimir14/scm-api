import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../auth';
import { roleService } from './role.service';
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  syncFeaturesSchema,
} from './role.schema';
import { paginationSchema } from '../../common/schemas';
import { AppError } from '../../common/errors';
import { logFromRequest } from '../audit-log';

export async function roleRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);
  fastify.addHook('onRequest', requireAdmin);

  // GET /roles - List all roles
  fastify.get('/', async (request, reply) => {
    const query = paginationSchema.parse(request.query);
    const result = await roleService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  // GET /roles/:id - Get a single role
  fastify.get('/:id', async (request, reply) => {
    const { id } = roleIdSchema.parse(request.params);
    const role = await roleService.findById(id);
    return reply.send({ success: true, data: role });
  });

  // POST /roles - Create a new role
  fastify.post('/', async (request, reply) => {
    const input = createRoleSchema.parse(request.body);
    const role = await roleService.create(input);
    logFromRequest(request, 'CREACION', 'Roles', `Rol creado: ${input.nombre}`);
    return reply.status(201).send({ success: true, data: role });
  });

  // PUT /roles/:id - Update a role
  fastify.put('/:id', async (request, reply) => {
    const { id } = roleIdSchema.parse(request.params);
    const input = updateRoleSchema.parse(request.body);

    if (Object.keys(input).length === 0) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const role = await roleService.update(id, input);
    logFromRequest(request, 'ACTUALIZACION', 'Roles', `Rol actualizado: ID ${id}`);
    return reply.send({ success: true, data: role });
  });

  // DELETE /roles/:id - Delete a role
  fastify.delete('/:id', async (request, reply) => {
    const { id } = roleIdSchema.parse(request.params);
    await roleService.delete(id);
    logFromRequest(request, 'ELIMINACION', 'Roles', `Rol eliminado: ID ${id}`);
    return reply.status(204).send();
  });

  // GET /roles/:id/features - Get feature keys for a role
  fastify.get('/:id/features', async (request, reply) => {
    const { id } = roleIdSchema.parse(request.params);
    const featureKeys = await roleService.getFeatureKeys(id);
    return reply.send({ success: true, data: featureKeys });
  });

  // PUT /roles/:id/features - Sync features for a role
  fastify.put('/:id/features', async (request, reply) => {
    const { id } = roleIdSchema.parse(request.params);
    const { featureKeys } = syncFeaturesSchema.parse(request.body);
    const result = await roleService.syncFeatures(id, featureKeys);
    logFromRequest(request, 'ACTUALIZACION', 'Roles', `Permisos actualizados para rol ID ${id}`);
    return reply.send({ success: true, data: result });
  });
}
