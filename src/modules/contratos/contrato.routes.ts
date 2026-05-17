import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { contratoService } from './contrato.service';
import {
  createContratoSchema,
  updateContratoSchema,
  cambiarEstadoSchema,
  addTratamientoSchema,
  updateTratamientoItemSchema,
  registrarPagoSchema,
  editarPagoSchema,
  anularPagoSchema,
  contratoQuerySchema,
  idParamSchema,
  itemIdParamSchema,
  pagoIdParamSchema,
} from './contrato.schema';
import { getClinicScope } from '../../common/helpers/clinic-scope';
import { logFromRequest } from '../audit-log';
import { z } from 'zod';

const pacienteIdParamSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
});

export default async function contratoRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET /contratos
  fastify.get('/contratos', async (request, reply) => {
    const query = contratoQuerySchema.parse(request.query);
    const clinicaId = getClinicScope(request);
    const result = await contratoService.findAll(query, clinicaId);
    return reply.send({ success: true, ...result });
  });

  // GET /contratos/paciente/:pacienteId
  fastify.get('/contratos/paciente/:pacienteId', async (request, reply) => {
    const { pacienteId } = pacienteIdParamSchema.parse(request.params);
    const clinicaId = getClinicScope(request);
    const data = await contratoService.findByPaciente(pacienteId, clinicaId);
    return reply.send({ success: true, data });
  });

  // GET /contratos/:id/historial
  fastify.get('/contratos/:id/historial', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const clinicaId = getClinicScope(request);
    const data = await contratoService.getHistorial(id, clinicaId);
    return reply.send({ success: true, data });
  });

  // GET /contratos/:id
  fastify.get('/contratos/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.findById(id, clinicaId);
    return reply.send({ success: true, data: contrato });
  });

  // POST /contratos
  fastify.post('/contratos', async (request, reply) => {
    const input = createContratoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const contrato = await contratoService.create(input, usuarioId, nombreUsuario);
    logFromRequest(request, 'CREACION', 'Contratos', `Contrato creado: ${contrato.numero}`);
    return reply.status(201).send({ success: true, data: contrato });
  });

  // PUT /contratos/:id
  fastify.put('/contratos/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = updateContratoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.update(id, input, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ACTUALIZACION', 'Contratos', `Contrato actualizado: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // PUT /contratos/:id/estado
  fastify.put('/contratos/:id/estado', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { estado } = cambiarEstadoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.cambiarEstado(id, estado, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ACTUALIZACION', 'Contratos', `Estado cambiado a ${estado}: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // DELETE /contratos/:id
  fastify.delete('/contratos/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const clinicaId = getClinicScope(request);
    await contratoService.delete(id, clinicaId);
    logFromRequest(request, 'ELIMINACION', 'Contratos', `Contrato eliminado: ${id}`);
    return reply.status(204).send();
  });

  // POST /contratos/:id/tratamientos
  fastify.post('/contratos/:id/tratamientos', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = addTratamientoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.addTratamiento(id, input, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'CREACION', 'Contratos', `Tratamiento agregado al contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // PUT /contratos/:id/tratamientos/:itemId
  fastify.put('/contratos/:id/tratamientos/:itemId', async (request, reply) => {
    const { id, itemId } = itemIdParamSchema.parse(request.params);
    const input = updateTratamientoItemSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.updateTratamientoItem(id, itemId, input, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ACTUALIZACION', 'Contratos', `Tratamiento actualizado en contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // DELETE /contratos/:id/tratamientos/:itemId
  fastify.delete('/contratos/:id/tratamientos/:itemId', async (request, reply) => {
    const { id, itemId } = itemIdParamSchema.parse(request.params);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.removeTratamiento(id, itemId, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ELIMINACION', 'Contratos', `Tratamiento eliminado del contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // POST /contratos/:id/pagos
  fastify.post('/contratos/:id/pagos', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const input = registrarPagoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.registrarPago(id, input, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'CREACION', 'Contratos', `Pago registrado en contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // PUT /contratos/:id/pagos/:pagoId
  fastify.put('/contratos/:id/pagos/:pagoId', async (request, reply) => {
    const { id, pagoId } = pagoIdParamSchema.parse(request.params);
    const input = editarPagoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.editarPago(id, pagoId, input, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ACTUALIZACION', 'Contratos', `Pago editado en contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });

  // PUT /contratos/:id/pagos/:pagoId/anular
  fastify.put('/contratos/:id/pagos/:pagoId/anular', async (request, reply) => {
    const { id, pagoId } = pagoIdParamSchema.parse(request.params);
    const { motivoAnulacion } = anularPagoSchema.parse(request.body);
    const user = request.user;
    const usuarioId = Number(user.sub);
    const nombreUsuario = user.nombre;
    const clinicaId = getClinicScope(request);
    const contrato = await contratoService.anularPago(id, pagoId, motivoAnulacion, usuarioId, nombreUsuario, clinicaId);
    logFromRequest(request, 'ACTUALIZACION', 'Contratos', `Pago anulado en contrato: ${id}`);
    return reply.send({ success: true, data: contrato });
  });
}
