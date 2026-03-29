import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import * as z from 'zod';
import { env } from '../../src/config';
import { AppError } from '../../src/common/errors';

/**
 * Builds a lightweight Fastify instance for integration tests.
 * Registers JWT and error handler but skips cors/helmet to keep tests fast.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  // Mirror the error handler from app.ts so Zod/AppError responses work in tests
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.issues.map((issue: z.ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.message,
      });
    }

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      success: false,
      error: error.message,
    });
  });

  return app;
}

/**
 * Generates a valid JWT token for test requests.
 */
export function getTestToken(app: FastifyInstance, payload?: { sub: string; role: string }): string {
  return app.jwt.sign(payload ?? { sub: 'test-user-1', role: 'admin' });
}
