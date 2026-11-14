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

interface videogameFetchResult {
  id: number;
  name: string;
  desc?: string;
  teamName: string;
  status: string;
  gameFileURL?: string;
  entry?: string;
}

const BACKEND_BASE = (import.meta.env.VITE_ENDPOINT_BACKEND as string) || 'http://localhost:3000';

// Convierte la respuesta de error de /upload en un mensaje legible para el usuario.
// El backend limita las subidas por IP (429) y valida el contenido real del archivo (400) (BG-02).
async function uploadErrorMessage(res: Response, maxSize: string): Promise<string> {
  if (res.status === 429) {
    return 'Se han hecho demasiadas solicitudes desde tu red. Espera un minuto e inténtalo de nuevo.';
  }
  if (res.status === 413) {
    return `Uno de los archivos es demasiado grande. El tamaño máximo permitido es ${maxSize}.`;
  }
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
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
    throw new Error(await uploadErrorMessage(res, '1MB'));
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
    throw new Error(await uploadErrorMessage(res, '500MB'));
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
  const parsed = new URL(urlResult.url);
  if (parsed.hostname === 'azurite') {
    const parsed = new URL(urlResult.url);
    const base = new URL(BACKEND_BASE);
    parsed.hostname = base.hostname;
    urlResult.url = parsed.toString();
  }
  return urlResult;
}

//funcion auxiliar para obtener URL y entrypoint de archivos estaticos de un juego dado.
export async function getGameFileEntry(videogameID: number): Promise<videogameFetchResult> {
  const endpoint = `${BACKEND_BASE.replace(/\/$/, '')}/videogames/${videogameID}`;

  const res = await apiFetch(
    `${endpoint}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`getImageUrl failed: ${res.status} ${res.statusText} ${text}`);
  }

  const videogameFetchResult = (await res.json()) as videogameFetchResult;

  //Si se está en ambiente de desarrollo, el backend mandará las SAS a las imagenes en
  //formato de URL entre contenedores (hostnames = docker service names)
  //en cuyo caso, toca reemplazar el hostname por el real (el real siendo el mismo del BACKEND_BASE_URL)
  const parsed = new URL(videogameFetchResult.gameFileURL);
  if (parsed.hostname === 'azurite') {
    const parsed = new URL(videogameFetchResult.gameFileURL);
    const base = new URL(BACKEND_BASE);
    parsed.hostname = base.hostname;
    videogameFetchResult.gameFileURL = parsed.toString();
  }
  console.log("videogame static url: ", videogameFetchResult.gameFileURL);
  console.log("videogame entry point: ", videogameFetchResult.entry);
  return videogameFetchResult;
}
