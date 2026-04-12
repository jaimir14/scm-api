import { FastifyRequest } from 'fastify';
import { prisma } from '../../database';

type Accion = 'INICIO_SESION' | 'CREACION' | 'ACTUALIZACION' | 'ELIMINACION' | 'CONSULTA';

export interface LogActivityParams {
  usuarioId?: number;
  usuario: string;
  accion: Accion;
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

/**
 * Shorthand to log from an authenticated request.
 * Extracts user info and IP from the request automatically.
 */
export function logFromRequest(
  request: FastifyRequest,
  accion: Accion,
  modulo: string,
  detalle?: string,
): void {
  const user = request.user;
  // Fire and forget — don't await
  logActivity({
    usuarioId: user ? parseInt(user.sub) : undefined,
    usuario: user?.nombre ?? 'unknown',
    accion,
    modulo,
    ip: request.ip,
    detalle,
  });
}
