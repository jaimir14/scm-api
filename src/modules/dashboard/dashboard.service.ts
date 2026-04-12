import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { appointmentService } from '../appointments/appointment.service';
import { auditLogService } from '../audit-log/audit-log.service';

export class DashboardService {
  async getStats(clinicaId?: number | null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentWhere: Prisma.AppointmentWhereInput = {
      fecha: { gte: today, lt: tomorrow },
      ...(clinicaId ? { profesional: { clinicaId } } : {}),
    };
    const patientWhere: Prisma.PatientWhereInput = clinicaId ? { clinicaId } : {};
    const activePatientWhere: Prisma.PatientWhereInput = { estado: true, ...(clinicaId ? { clinicaId } : {}) };

    const [citasHoy, pacientes, expedientes, clinicas] = await Promise.all([
      prisma.appointment.count({ where: appointmentWhere }),
      prisma.patient.count({ where: patientWhere }),
      prisma.patient.count({ where: activePatientWhere }),
      prisma.clinic.count({ where: { estado: true } }),
    ]);

    return { citasHoy, pacientes, expedientes, clinicas };
  }

  async getUpcomingAppointments(clinicaId?: number | null) {
    return appointmentService.findUpcomingToday(5, clinicaId);
  }

  async getRecentActivity() {
    return auditLogService.findRecent(10);
  }
}

export const dashboardService = new DashboardService();
