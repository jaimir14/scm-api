import { FastifyInstance } from 'fastify';
import { authenticate } from '../auth';
import { patientFileService } from './patient-file.service';
import {
  filePresignedUrlSchema,
  registerFileSchema,
  patientIdParamSchema,
  consultationIdParamSchema,
  fileIdParamSchema,
} from './patient-file.schema';
import { logFromRequest } from '../audit-log';

export async function patientFileRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // POST /patient-files/presigned-url - Get a presigned upload URL
  fastify.post('/presigned-url', async (request, reply) => {
    const input = filePresignedUrlSchema.parse(request.body);
    const result = await patientFileService.getPresignedUploadUrl(input);
    return reply.send({ success: true, data: result });
  });

  // POST /patient-files - Register an uploaded file
  fastify.post('/', async (request, reply) => {
    const input = registerFileSchema.parse(request.body);
    const file = await patientFileService.register(input);
    logFromRequest(request, 'CREACION', 'Archivos', `Archivo subido: ${input.fileName} para paciente ID ${input.pacienteId}`);
    return reply.status(201).send({ success: true, data: file });
  });

  // GET /patient-files/patient/:pacienteId - List all files for a patient
  fastify.get('/patient/:pacienteId', async (request, reply) => {
    const { pacienteId } = patientIdParamSchema.parse(request.params);
    const files = await patientFileService.findByPatient(pacienteId);
    return reply.send({ success: true, data: files });
  });

  // GET /patient-files/consultation/:consultaId - List files for a consultation
  fastify.get('/consultation/:consultaId', async (request, reply) => {
    const { consultaId } = consultationIdParamSchema.parse(request.params);
    const files = await patientFileService.findByConsultation(consultaId);
    return reply.send({ success: true, data: files });
  });

  // GET /patient-files/:id/view-url - Get a presigned view URL
  fastify.get('/:id/view-url', async (request, reply) => {
    const { id } = fileIdParamSchema.parse(request.params);
    const result = await patientFileService.getViewUrl(id);
    return reply.send({ success: true, data: result });
  });

  // DELETE /patient-files/:id - Delete a file
  fastify.delete('/:id', async (request, reply) => {
    const { id } = fileIdParamSchema.parse(request.params);
    await patientFileService.delete(id);
    logFromRequest(request, 'ELIMINACION', 'Archivos', `Archivo eliminado: ID ${id}`);
    return reply.status(204).send();
  });
}
