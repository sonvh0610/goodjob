import { apiRequest } from './api';

interface PresignResponse {
  uploadUrl: string;
  mediaAsset: {
    id: string;
    mediaType: 'image' | 'video';
  };
}

function mediaTypeForFile(file: File): 'image' | 'video' {
  return file.type.startsWith('image/') ? 'image' : 'video';
}

const MAX_VIDEO_DURATION_SECONDS = 180;

export function validateFile(file: File) {
  if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
    throw new Error('Image file size must be <= 1MB');
  }
}

async function getVideoDurationSeconds(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.onerror = () => {
        reject(new Error('Unable to read video metadata'));
      };
      video.src = objectUrl;
    });
    return duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadMedia(file: File): Promise<string> {
  validateFile(file);
  const mediaType = mediaTypeForFile(file);
  const durationSeconds =
    mediaType === 'video' ? await getVideoDurationSeconds(file) : undefined;

  if (
    typeof durationSeconds === 'number' &&
    durationSeconds > MAX_VIDEO_DURATION_SECONDS
  ) {
    throw new Error('Video duration must be 3 minutes or less');
  }

  const presign = await apiRequest<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSizeBytes: file.size,
      mediaType,
    },
  });

  const uploaded = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!uploaded.ok) {
    throw new Error('Media upload failed');
  }

  await apiRequest('/uploads/complete', {
    method: 'POST',
    body: {
      mediaAssetId: presign.mediaAsset.id,
      durationSeconds,
    },
  });

  return presign.mediaAsset.id;
}

export async function uploadManyMedia(files: File[]): Promise<string[]> {
  if (files.length > 5) {
    throw new Error('Maximum 5 media files per kudo');
  }

  const ids: string[] = [];
  for (const file of files) {
    const id = await uploadMedia(file);
    ids.push(id);
  }
  return ids;
}
