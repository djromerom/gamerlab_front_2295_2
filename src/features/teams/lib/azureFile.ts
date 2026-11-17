import { apiFetch } from "@/lib/api";
// Frontend JavaScript/TypeScript
// Frontend TypeScript helper for file upload and temporary URL retrieval
export interface UploadResult {
  id: string;
  blobName: string;
  filename: string;
  mimetype: string;
  size: number;
  entry?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface UrlResult {
  url: string;
  expiresAt: string;
}

const BACKEND_BASE = (import.meta.env.VITE_ENDPOINT_BACKEND as string) || 'http://localhost:3000';

/** HU-40 (ARK-225): máximo del zip del juego, igual al del back (MAX_ZIP_SIZE_MB), y el tamaño recomendado. */
export const MAX_ZIP_MB = 200;
export const MAX_ZIP_BYTES = MAX_ZIP_MB * 1024 * 1024;
export const RECOMMENDED_ZIP_MB = 50;

// Convierte la respuesta de error de /upload en un mensaje legible para el usuario.
// El backend limita las subidas por IP (429) y valida el contenido real del archivo (400) (BG-02).
// Ante un 413 se muestra el mensaje del back («El archivo supera el máximo de 200 MB.»); si el que corta es el nginx
// (responde HTML, sin JSON), se arma el texto con el límite real.
export async function uploadErrorMessage(res: Response, maxSize: string): Promise<string> {
  if (res.status === 429) {
    return 'Se han hecho demasiadas solicitudes desde tu red. Espera un minuto e inténtalo de nuevo.';
  }
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
  if (res.status === 413) {
    return message || `El archivo es demasiado grande. El tamaño máximo permitido es ${maxSize}.`;
  }
  return message || `No se pudo subir el archivo (error ${res.status}).`;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch(`${BACKEND_BASE.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // include cookies for auth if backend relies on them
  });

  if (!res.ok) {
    throw new Error(await uploadErrorMessage(res, '1 MB'));
  }

  const uploadResult = (await res.json()) as UploadResult;
  return uploadResult;
}

export async function uploadZip(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch(`${BACKEND_BASE.replace(/\/$/, '')}/upload/zip`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

  if (!res.ok) {
    throw new Error(await uploadErrorMessage(res, `${MAX_ZIP_MB} MB`));
  }

  return (await res.json()) as UploadResult;
}

export async function getImageUrl(uploadId: string): Promise<UrlResult> {
  if (!uploadId) throw new Error('getImageUrl: uploadId is required');

  const res = await apiFetch(
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
  urlResult.url = reachableBlobUrl(urlResult.url);
  return urlResult;
}

/**
 * En desarrollo el back firma las URLs con el nombre del contenedor de Azurite («azurite»), que el navegador no
 * resuelve: se cambia por el host del back. Las demás URLs (y la cadena vacía) pasan sin cambios.
 */
export function reachableBlobUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'azurite') return url;
    parsed.hostname = new URL(BACKEND_BASE).hostname;
    return parsed.toString();
  } catch {
    return url;
  }
}
