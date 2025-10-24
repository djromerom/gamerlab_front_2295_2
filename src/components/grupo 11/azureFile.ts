// Frontend JavaScript/TypeScript
// Frontend TypeScript helper for file upload and temporary URL retrieval
export interface UploadResult {
  id: string;
  blobName: string;
  filename: string;
  mimetype: string;
  size: number;
  isPublic: boolean;
  createdAt: string;
}

export interface UrlResult {
  url: string;
  expiresAt: string;
}

const BACKEND_BASE = (import.meta.env.VITE_ENDPOINT_BACKEND as string) || 'http://localhost:3000';

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // include cookies for auth if backend relies on them
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`uploadImage failed: ${res.status} ${res.statusText} ${text}`);
  }

  const uploadResult = (await res.json()) as UploadResult;
  console.debug('[azureFile] uploadImage result:', uploadResult);
  return uploadResult;
}

export async function getImageUrl(uploadId: string, ttlSeconds = 900): Promise<string> {
  if (!uploadId) throw new Error('getImageUrl: uploadId is required');

  const res = await fetch(
    `${BACKEND_BASE.replace(/\/$/, '')}/upload/${encodeURIComponent(uploadId)}/url?ttl=${encodeURIComponent(
      String(ttlSeconds)
    )}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`getImageUrl failed: ${res.status} ${res.statusText} ${text}`);
  }

  const urlResult = (await res.json()) as UrlResult;
  console.debug('[azureFile] getImageUrl result:', urlResult);
  return urlResult.url;
}