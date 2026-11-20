import { apiFetch } from '@/lib/api';

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || 'http://localhost:3000';

export const JURORS_EXPORT_FALLBACK_NAME = 'asignacion_jurados.xlsx';
const DEFAULT_ERROR = 'No se pudo exportar la asignación de jurados.';

/**
 * Nombre del archivo que manda el back en `Content-Disposition`
 * (`filename*=UTF-8''...` primero, luego `filename="..."`). Null si no viene.
 */
export function fileNameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const match =
    disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i) ||
    disposition.match(/filename="?([^";\n\r]+)"?/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

/**
 * Descarga el Excel de asignación de jurados (`GET /reports/exportJurados`) con UNA sola
 * petición. Si el back responde un error, lanza un Error con su `message`
 * (por ejemplo "No hay asignaciones para exportar."). Devuelve el nombre del archivo.
 */
export async function downloadJurorsExport(): Promise<string> {
  const response = await apiFetch(`${API_URL}/reports/exportJurados`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let message = DEFAULT_ERROR;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string' && body.message) message = body.message;
    } catch {
      // El cuerpo no es JSON: queda el mensaje por defecto
    }
    throw new Error(message);
  }

  const fileName =
    fileNameFromDisposition(response.headers.get('content-disposition')) ??
    JURORS_EXPORT_FALLBACK_NAME;

  saveBlobAsFile(await response.blob(), fileName);
  return fileName;
}

/** Guarda un archivo descargado (por ejemplo un Excel) con el nombre dado. */
export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
