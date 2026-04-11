import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { generateUploadUrl, generateViewUrl, deleteObject } from '../../lib/s3';
import { env } from '../../config';
import { FilePresignedUrlInput, RegisterFileInput } from './patient-file.schema';
import { randomUUID } from 'crypto';

type PatientFile = Awaited<ReturnType<typeof prisma.patientFile.findFirstOrThrow>>;

export class PatientFileService {
  private get bucket(): string {
    if (!env.SPACES_BUCKET) {
      throw new Error('SPACES_BUCKET is not configured');
    }
    return env.SPACES_BUCKET;
  }

  async getPresignedUploadUrl(input: FilePresignedUrlInput) {
    const { pacienteId, consultaId, fileName, mimeType } = input;

    const today = new Date().toISOString().substring(0, 10);
    const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const uniqueName = `${randomUUID()}${ext}`;

    // Files go under patients/{id}/files/ (separate from images)
    // If linked to a consultation, include the consultation id in the path
    const basePath = consultaId
      ? `patients/${pacienteId}/files/${today}/${consultaId}`
      : `patients/${pacienteId}/files/${today}`;
    const storagePath = `${basePath}/${uniqueName}`;

    const uploadUrl = await generateUploadUrl(this.bucket, storagePath, mimeType);

    return { uploadUrl, storagePath };
  }

  async register(input: RegisterFileInput): Promise<PatientFile> {
    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id: input.pacienteId } });
    if (!patient) {
      throw new NotFoundError('Patient');
    }

    // Verify consultation exists if provided
    if (input.consultaId) {
      const consultation = await prisma.consultation.findUnique({ where: { id: input.consultaId } });
      if (!consultation) {
        throw new NotFoundError('Consultation');
      }
    }

    return prisma.patientFile.create({ data: input });
  }

  async findByPatient(pacienteId: number) {
    const files = await prisma.patientFile.findMany({
      where: { pacienteId },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachViewUrls(files);
  }

  async findByConsultation(consultaId: number) {
    const files = await prisma.patientFile.findMany({
      where: { consultaId },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachViewUrls(files);
  }

  async getViewUrl(id: number) {
    const file = await prisma.patientFile.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundError('PatientFile');
    }
    const viewUrl = await generateViewUrl(this.bucket, file.storagePath);
    return { ...file, viewUrl };
  }

  async delete(id: number): Promise<void> {
    const file = await prisma.patientFile.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundError('PatientFile');
    }

    await deleteObject(this.bucket, file.storagePath);
    await prisma.patientFile.delete({ where: { id } });
  }

  private async attachViewUrls(files: PatientFile[]) {
    return Promise.all(
      files.map(async (file) => ({
        ...file,
        viewUrl: await generateViewUrl(this.bucket, file.storagePath),
      })),
    );
  }
}

export const patientFileService = new PatientFileService();
