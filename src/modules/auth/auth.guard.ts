import { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      error: 'Unauthorized: Invalid or missing token',
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user?.esAdmin) {
    reply.status(403).send({
      success: false,
      error: 'Forbidden: Se requieren permisos de administrador',
    });
  }
}
