import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { jwtPlugin } from './plugins';
import { errorHandler } from './common/middleware';
import { authRoutes } from './modules/auth';
import { patientRoutes } from './modules/patients';
import { env } from './config';
import * as z from 'zod';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // --- Security plugins ---
  await app.register(cors, {
    origin: true, // Configure per environment in production
    credentials: true,
  });
  await app.register(helmet);

  // --- JWT plugin ---
  await app.register(jwtPlugin);

  // --- Global error handler ---
  app.setErrorHandler((error, request, reply) => {
    // Handle Zod validation errors
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
    return errorHandler(error as any, request, reply);
  });

  // --- Health check ---
  app.get('/health', async () => ({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  }));

  // --- Routes ---
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(patientRoutes, { prefix: '/api/v1/patients' });

  return app;
}
