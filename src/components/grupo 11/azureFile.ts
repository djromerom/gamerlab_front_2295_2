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

export async function uploadZip(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BACKEND_BASE.replace(/\/$/, '')}/upload/zip`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`uploadZip failed: ${res.status} ${res.statusText} ${text}`);
  }

  return (await res.json()) as UploadResult;
}

export async function getImageUrl(uploadId: string): Promise<UrlResult> {
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
  return urlResult;
}

//funcion auxiliar para obtener URL y entrypoint de archivos estaticos de un juego dado.
export async function getGameFileEntry(videogameID: number): Promise<videogameFetchResult> {
  const endpoint = `${BACKEND_BASE.replace(/\/$/, '')}/videogames/${videogameID}`;

  const res = await fetch(
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
