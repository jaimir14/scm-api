import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { dashboardService } from './dashboard.service';
import { getClinicScope } from '../../common/helpers/clinic-scope';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /dashboard/stats - Aggregate stats
  fastify.get('/stats', async (request, reply) => {
    const clinicaId = getClinicScope(request);
    const data = await dashboardService.getStats(clinicaId);
    return reply.send({ success: true, data });
  });

  // GET /dashboard/upcoming-appointments - Next 5 appointments for today
  fastify.get('/upcoming-appointments', async (request, reply) => {
    const clinicaId = getClinicScope(request);
    const data = await dashboardService.getUpcomingAppointments(clinicaId);
    return reply.send({ success: true, data });
  });

  // GET /dashboard/recent-activity - Last 10 audit log entries
  fastify.get('/recent-activity', async (request, reply) => {
    const data = await dashboardService.getRecentActivity();
    return reply.send({ success: true, data });
  });
}
