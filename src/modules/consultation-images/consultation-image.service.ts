import { prisma } from '../../database';
import { NotFoundError } from '../../common/errors';
import { generateUploadUrl, generateViewUrl, deleteObject } from '../../lib/s3';
import { env } from '../../config';
import { PresignedUrlInput, RegisterImageInput } from './consultation-image.schema';
import { randomUUID } from 'crypto';

type ConsultationImage = Awaited<ReturnType<typeof prisma.consultationImage.findFirstOrThrow>>;

export class ConsultationImageService {
  private get bucket(): string {
    if (!env.SPACES_BUCKET) {
      throw new Error('SPACES_BUCKET is not configured');
    }
    return env.SPACES_BUCKET;
  }

  async getPresignedUploadUrl(input: PresignedUrlInput) {
    const { pacienteId, citaId, fileName, mimeType } = input;

    const today = new Date().toISOString().substring(0, 10);
    const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
    const uniqueName = `${randomUUID()}${ext}`;
    const storagePath = `patients/${pacienteId}/${today}/${citaId}/${uniqueName}`;

    const uploadUrl = await generateUploadUrl(this.bucket, storagePath, mimeType);

    return { uploadUrl, storagePath };
  }

  async register(input: RegisterImageInput): Promise<ConsultationImage> {
    // Verify the consultation exists
    const consultation = await prisma.consultation.findUnique({
      where: { id: input.consultaId },
    });
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    return prisma.consultationImage.create({ data: input });
  }

  async findByConsultation(consultaId: number) {
    const images = await prisma.consultationImage.findMany({
      where: { consultaId },
      orderBy: { createdAt: 'desc' },
    });

    // Generate view URLs for each image
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => ({
        ...image,
        viewUrl: await generateViewUrl(this.bucket, image.storagePath),
      })),
    );

    return imagesWithUrls;
  }

  async getViewUrl(id: number) {
    const image = await prisma.consultationImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundError('ConsultationImage');
    }
    const viewUrl = await generateViewUrl(this.bucket, image.storagePath);
    return { ...image, viewUrl };
  }

  async delete(id: number): Promise<void> {
    const image = await prisma.consultationImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundError('ConsultationImage');
    }

    // Delete from Spaces
    await deleteObject(this.bucket, image.storagePath);

    // Delete from DB
    await prisma.consultationImage.delete({ where: { id } });
  }
}

export const consultationImageService = new ConsultationImageService();
