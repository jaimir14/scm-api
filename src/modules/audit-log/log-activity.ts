import { prisma } from '../../database';

export interface LogActivityParams {
  usuarioId?: number;
  usuario: string;
  accion: 'INICIO_SESION' | 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION' | 'CONSULTA';
  modulo: string;
  ip?: string;
  detalle?: string;
}

/**
 * Utility function to log activity to the audit log.
 * Can be called from any module to record actions.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: params.usuarioId,
        usuario: params.usuario,
        accion: params.accion,
        modulo: params.modulo,
        ip: params.ip,
        detalle: params.detalle,
      },
    });
  } catch (error) {
    // Log errors silently — audit logging should not break the main flow
    console.error('[AUDIT LOG ERROR]', error);
  }
}
