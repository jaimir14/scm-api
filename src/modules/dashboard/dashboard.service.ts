import { prisma } from '../../database';
import { appointmentService } from '../appointments/appointment.service';
import { auditLogService } from '../audit-log/audit-log.service';

export class DashboardService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [citasHoy, pacientes, expedientes, clinicas] = await Promise.all([
      prisma.appointment.count({
        where: { fecha: { gte: today, lt: tomorrow } },
      }),
      prisma.patient.count(),
      prisma.patient.count({ where: { estado: true } }),
      prisma.clinic.count({ where: { estado: true } }),
    ]);

    return { citasHoy, pacientes, expedientes, clinicas };
  }

  async getUpcomingAppointments() {
    return appointmentService.findUpcomingToday(5);
  }

  async getRecentActivity() {
    return auditLogService.findRecent(10);
  }
}

export const dashboardService = new DashboardService();
