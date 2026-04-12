import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema } from './auth.schema';
import { authenticate } from './auth.guard';
import { userService } from '../users/user.service';
import { UnauthorizedError } from '../../common/errors';
import { prisma } from '../../database';
import { logActivity } from '../audit-log';

/**
 * Auth routes - login, token generation (dev), current user info, and permissions.
 */
export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/token - Generate a JWT token (for development/testing)
  fastify.post('/token', async (request, reply) => {
    const body = request.body as {
      sub: string;
      role?: string;
      rolId?: number;
      esAdmin?: boolean;
    };
    const token = fastify.jwt.sign({
      sub: body.sub,
      rolId: body.rolId ?? 1,
      rol: body.role ?? 'Administrador',
      esAdmin: body.esAdmin ?? true,
      nombre: 'Test User',
    });

    return reply.send({
      success: true,
      data: { token },
    });
  });

  // POST /auth/login - Authenticate user with credentials
  fastify.post('/login', async (request, reply) => {
    const { usuario, password } = loginSchema.parse(request.body);

    const user = await userService.findByUsuario(usuario);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.estado) {
      throw new UnauthorizedError('User account is disabled');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last access
    await userService.updateLastAccess(user.id);

    const rolNombre = user.rol?.nombre ?? '';
    const esAdmin = user.rol?.esAdmin ?? false;

    const jwtPayload = {
      sub: user.id.toString(),
      rolId: user.rolId,
      rol: rolNombre,
      esAdmin,
      nombre: user.nombre,
      especialidad: user.especialidad ?? null,
      clinicaId: user.clinicaId ?? null,
    };

    const token = fastify.jwt.sign(jwtPayload);

    const userData = {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      rolId: user.rolId,
      rol: rolNombre,
      esAdmin,
      especialidad: user.especialidad ?? null,
      clinicaId: user.clinicaId ?? null,
    };

    logActivity({
      usuarioId: user.id,
      usuario: user.nombre,
      accion: 'INICIO_SESION',
      modulo: 'Autenticación',
      ip: request.ip,
      detalle: `Inicio de sesión: ${user.usuario}`,
    });

    return reply.send({
      success: true,
      data: {
        token,
        user: userData,
      },
    });
  });

  // GET /auth/me - Get current user info from token (protected)
  fastify.get('/me', { onRequest: [authenticate] }, async (request, reply) => {
    const payload = request.user;

    return reply.send({
      success: true,
      data: {
        id: parseInt(payload.sub),
        rolId: payload.rolId,
        rol: payload.rol,
        esAdmin: payload.esAdmin,
        nombre: payload.nombre,
        especialidad: payload.especialidad ?? null,
        clinicaId: payload.clinicaId ?? null,
      },
    });
  });

  // GET /auth/my-permissions - Get feature keys for the current user's role
  fastify.get('/my-permissions', { onRequest: [authenticate] }, async (request, reply) => {
    const payload = request.user;

    const roleFeatures = await prisma.roleFeature.findMany({
      where: { rolId: payload.rolId },
      include: { feature: true },
    });

    const permissions: string[] = roleFeatures.map(rf => rf.feature.clave);

    // If the role is admin, include the special __admin__ key
    if (payload.esAdmin) {
      permissions.push('__admin__');
    }

    return reply.send({
      success: true,
      data: permissions,
    });
  });
}
