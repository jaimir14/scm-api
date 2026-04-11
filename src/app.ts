import Fastify, { FastifyError, FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { jwtPlugin } from './plugins';
import { errorHandler } from './common/middleware';
import { AppError } from './common/errors';
import { authRoutes } from './modules/auth';
import { patientRoutes } from './modules/patients';
import { clinicRoutes } from './modules/clinics';
import { professionalRoutes } from './modules/professionals';
import { userRoutes } from './modules/users';
import { appointmentTypeRoutes } from './modules/appointment-types';
import { treatmentRoutes } from './modules/treatments';
import { consultationRoutes, patientConsultationRoutes } from './modules/consultations';
import { appointmentRoutes } from './modules/appointments';
import { auditLogRoutes } from './modules/audit-log';
import { dashboardRoutes } from './modules/dashboard';
import { reportRoutes } from './modules/reports';
import { configRoutes } from './modules/config';
import { consultationImageRoutes } from './modules/consultation-images';
import { patientFileRoutes } from './modules/patient-files';
import { env } from './config';
import * as z from 'zod';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: 'info',
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
    return errorHandler(error as FastifyError | AppError, request, reply);
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
  app.register(clinicRoutes, { prefix: '/api/v1/clinics' });
  app.register(professionalRoutes, { prefix: '/api/v1/professionals' });
  app.register(userRoutes, { prefix: '/api/v1/users' });
  app.register(appointmentTypeRoutes, { prefix: '/api/v1/appointment-types' });
  app.register(treatmentRoutes, { prefix: '/api/v1/treatments' });
  app.register(consultationRoutes, { prefix: '/api/v1/consultations' });
  app.register(patientConsultationRoutes, { prefix: '/api/v1/patients/:patientId/consultations' });
  app.register(appointmentRoutes, { prefix: '/api/v1/appointments' });
  app.register(auditLogRoutes, { prefix: '/api/v1/audit-log' });
  app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  app.register(reportRoutes, { prefix: '/api/v1/reports' });
  app.register(configRoutes, { prefix: '/api/v1/config' });
  app.register(consultationImageRoutes, { prefix: '/api/v1/consultation-images' });
  app.register(patientFileRoutes, { prefix: '/api/v1/patient-files' });

  return app;
}
