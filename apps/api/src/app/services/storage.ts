import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnv } from '../config/env.js';

const env = getEnv();

const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: Boolean(env.S3_ENDPOINT),
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

let ensureBucketPromise: Promise<void> | null = null;

async function ensureBucketExists() {
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: env.S3_BUCKET,
      })
    );
    return;
  } catch {
    // Continue to create when bucket does not exist or is not yet reachable.
  }

  await s3Client.send(
    new CreateBucketCommand({
      Bucket: env.S3_BUCKET,
    })
  );
}

async function ensureBucketReady() {
  if (!ensureBucketPromise) {
    ensureBucketPromise = ensureBucketExists().catch((error) => {
      ensureBucketPromise = null;
      throw error;
    });
  }
  await ensureBucketPromise;
}

export function makeStorageKey(userId: string, fileName: string) {
  const extension = path.extname(fileName || '').slice(0, 16);
  return `uploads/${userId}/${Date.now()}-${randomUUID()}${extension}`;
}

export async function createPresignedUploadUrl(input: {
  key: string;
  mimeType: string;
}) {
  await ensureBucketReady();

  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: input.key,
    ContentType: input.mimeType,
  });
  const url = await getSignedUrl(s3Client, cmd, {
    expiresIn: 900,
  });
  return url;
}

export async function createPresignedReadUrl(input: { key: string }) {
  await ensureBucketReady();
  const cmd = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: input.key,
  });
  return getSignedUrl(s3Client, cmd, { expiresIn: 3600 });
}

export function makeObjectPublicUrl(key: string): string {
  if (env.S3_ENDPOINT) {
    return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
}
