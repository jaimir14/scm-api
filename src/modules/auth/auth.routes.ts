import { FastifyInstance } from 'fastify';

/**
 * Auth routes - provides a token generation endpoint for development/testing.
 * In production, tokens should be issued by your dedicated auth service.
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
}
