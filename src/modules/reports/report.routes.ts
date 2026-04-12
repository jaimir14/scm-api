import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { reportService } from './report.service';
import { getClinicScope } from '../../common/helpers/clinic-scope';
import {
  appointmentReportSchema,
  patientReportSchema,
  clinicReportSchema,
  treatmentReportSchema,
  userReportSchema,
} from './report.schema';

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /reports/appointments
  fastify.get('/appointments', async (request, reply) => {
    const query = appointmentReportSchema.parse(request.query);
    const clinicScope = getClinicScope(request);
    if (clinicScope) query.clinicaId = clinicScope;
    const result = await reportService.appointmentReport(query);
    return reply.send({ success: true, ...result });
  });

  // GET /reports/patients
  fastify.get('/patients', async (request, reply) => {
    const query = patientReportSchema.parse(request.query);
    const clinicScope = getClinicScope(request);
    if (clinicScope) query.clinicaId = clinicScope;
    const result = await reportService.patientReport(query);
    return reply.send({ success: true, ...result });
  });

  // GET /reports/clinics
  fastify.get('/clinics', async (request, reply) => {
    const query = clinicReportSchema.parse(request.query);
    const result = await reportService.clinicReport(query);
    return reply.send({ success: true, ...result });
  });

  // GET /reports/treatments
  fastify.get('/treatments', async (request, reply) => {
    const query = treatmentReportSchema.parse(request.query);
    const result = await reportService.treatmentReport(query);
    return reply.send({ success: true, ...result });
  });

  // GET /reports/users
  fastify.get('/users', async (request, reply) => {
    const query = userReportSchema.parse(request.query);
    const result = await reportService.userReport(query);
    return reply.send({ success: true, ...result });
  });
}
