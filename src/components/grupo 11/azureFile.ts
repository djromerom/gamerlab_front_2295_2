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
  return uploadResult;
}

export async function getImageUrl(uploadId: string): Promise<UrlResult> {
  console.log("tryna get url for ", uploadId);
  if (!uploadId) throw new Error('getImageUrl: uploadId is required');

  const res = await fetch(
    `${BACKEND_BASE.replace(/\/$/, '')}/upload/${encodeURIComponent(uploadId)}/url?
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

  //Si se está en ambiente de desarrollo, el backend mandará las SAS a las imagenes en
  //formato de URL entre contenedores (hostnames = docker service names)
  //en cuyo caso, toca reemplazar el hostname por el real (el real siendo el mismo del BACKEND_BASE_URL)
  const parsed = new URL(urlResult.url);
  if (parsed.hostname === 'azurite') {
    const parsed = new URL(urlResult.url);
    const base = new URL(BACKEND_BASE);
    parsed.hostname = base.hostname;
    urlResult.url = parsed.toString();
  }

  console.log("urlResult: ", urlResult.url);


  return urlResult;
}