import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config';

function createS3Client(): S3Client | null {
  if (!env.SPACES_ENDPOINT || !env.SPACES_ACCESS_KEY || !env.SPACES_SECRET_KEY) {
    return null;
  }

  return new S3Client({
    endpoint: env.SPACES_ENDPOINT,
    region: env.SPACES_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: env.SPACES_ACCESS_KEY,
      secretAccessKey: env.SPACES_SECRET_KEY,
    },
    forcePathStyle: false,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export const s3 = createS3Client();

export function getS3Client(): S3Client {
  if (!s3) {
    throw new Error('S3/Spaces is not configured. Set SPACES_* environment variables.');
  }
  return s3;
}

export async function generateUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 900, // 15 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function generateViewUrl(
  bucket: string,
  key: string,
  expiresIn = 3600, // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await getS3Client().send(command);
}
