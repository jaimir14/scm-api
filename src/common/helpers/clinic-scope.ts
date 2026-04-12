import { FastifyRequest } from 'fastify';

/**
 * Returns the clinicaId to filter by based on the user's role.
 * Admin users get null (no filter — see all clinics).
 * Non-admin users get their own clinicaId.
 */
export function getClinicScope(request: FastifyRequest): number | null {
  const user = request.user;
  if (user.esAdmin) return null;
  return user.clinicaId ?? null;
}
