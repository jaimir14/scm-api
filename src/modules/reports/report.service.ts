import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import {
  AppointmentReportQuery,
  PatientReportQuery,
  ClinicReportQuery,
  TreatmentReportQuery,
  UserReportQuery,
} from './report.schema';

export class ReportService {
  async appointmentReport(query: AppointmentReportQuery) {
    const where: Prisma.AppointmentWhereInput = {};

    if (query.desde || query.hasta) {
      where.fecha = {};
      if (query.desde) where.fecha.gte = new Date(query.desde);
      if (query.hasta) {
        const end = new Date(query.hasta);
        end.setDate(end.getDate() + 1);
        where.fecha.lt = end;
      }
    }
    if (query.profesionalId) where.profesionalId = query.profesionalId;
    if (query.clinicaId) where.profesional = { clinicaId: query.clinicaId };
    if (query.estado) where.estado = query.estado;

    const [data, count] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }],
        include: {
          paciente: true,
          profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } },
          tipoCita: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { data, count };
  }

  async patientReport(query: PatientReportQuery) {
    const where: Prisma.PatientWhereInput = {};

    if (query.clinicaId) where.clinicaId = query.clinicaId;
    if (query.profesionalId) where.profesionalId = query.profesionalId;
    if (query.sexo) where.sexo = query.sexo;

    const [data, count] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { nombre: 'asc' },
        include: {
          clinica: true,
          profesional: { select: { id: true, nombre: true, especialidad: true, clinicaId: true, clinica: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return { data, count };
  }

  async clinicReport(query: ClinicReportQuery) {
    const where: Prisma.ClinicWhereInput = {};
    if (query.estado !== undefined) where.estado = query.estado;

    const [data, count] = await Promise.all([
      prisma.clinic.findMany({
        where,
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { users: true, patients: true } } },
      }),
      prisma.clinic.count({ where }),
    ]);

    return { data, count };
  }

  async treatmentReport(query: TreatmentReportQuery) {
    const where: Prisma.TreatmentWhereInput = {};
    if (query.categoria) where.categoria = query.categoria;

    const [data, count] = await Promise.all([
      prisma.treatment.findMany({ where, orderBy: { nombre: 'asc' } }),
      prisma.treatment.count({ where }),
    ]);

    return { data, count };
  }

  async userReport(query: UserReportQuery) {
    const where: Prisma.UserWhereInput = {};
    if (query.rol) where.rol = query.rol;
    if (query.estado !== undefined) where.estado = query.estado;

    const [data, count] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          usuario: true,
          nombre: true,
          rol: true,
          estado: true,
          ultimoAcceso: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, count };
  }
}

export const reportService = new ReportService();
