import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      rolId: number;
      rol: string;
      esAdmin: boolean;
      nombre: string;
      especialidad?: string | null;
      clinicaId?: number | null;
    };
    user: {
      sub: string;
      rolId: number;
      rol: string;
      esAdmin: boolean;
      nombre: string;
      especialidad?: string | null;
      clinicaId?: number | null;
    };
  }
}
