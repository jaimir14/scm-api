import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { loginSchema } from './auth.schema';
import { authenticate } from './auth.guard';
import { userService } from '../users/user.service';
import { UnauthorizedError } from '../../common/errors';

/**
 * Auth routes - login, token generation (dev), and current user info.
 */
export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/token - Generate a JWT token (for development/testing)
  fastify.post('/token', {
    schema: {
      description: 'Generate a JWT token for testing purposes',
      body: {
        type: 'object',
        required: ['sub', 'role'],
        properties: {
          sub: { type: 'string', description: 'Subject (user ID)' },
          role: { type: 'string', description: 'User role' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { sub, role } = request.body as { sub: string; role: string };
      const token = fastify.jwt.sign({ sub, role });

      return reply.send({
        success: true,
        data: { token },
      });
    },
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

    const jwtPayload = {
      sub: user.id.toString(),
      role: user.rol,
      nombre: user.nombre,
      ...(user.rol === 'MEDICO' && {
        especialidad: user.especialidad,
        clinicaId: user.clinicaId,
      }),
    };

    const token = fastify.jwt.sign(jwtPayload);

    const userData: Record<string, unknown> = {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      rol: user.rol,
    };
    if (user.rol === 'MEDICO') {
      userData.especialidad = user.especialidad;
      userData.clinicaId = user.clinicaId;
    }

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
    const payload = request.user as {
      sub: string;
      role: string;
      nombre: string;
      especialidad?: string | null;
      clinicaId?: number | null;
    };

    const data: Record<string, unknown> = {
      id: parseInt(payload.sub),
      rol: payload.role,
      nombre: payload.nombre,
    };
    if (payload.role === 'MEDICO') {
      data.especialidad = payload.especialidad ?? null;
      data.clinicaId = payload.clinicaId ?? null;
    }

    return reply.send({
      success: true,
      data,
    });
  });
}
