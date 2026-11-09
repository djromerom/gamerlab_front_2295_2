import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** ARK-170: cuántos certificados se piden a la vez; el servidor no genera más de 3 PDF juntos. */
export const CERTIFICATE_BATCH_SIZE = 3;

export type BatchResult<T, R> =
  | { ok: true; item: T; value: R }
  | { ok: false; item: T; error: string };

/**
 * Corre la tarea sobre todos los elementos, de a `size` por vez. Un fallo no detiene a los demás.
 * Un lote de cientos tarda minutos: enviarlo todo junto agota el tiempo de las peticiones.
 */
export async function runInBatches<T, R>(
  items: T[],
  task: (item: T) => Promise<R>,
  size = CERTIFICATE_BATCH_SIZE,
): Promise<BatchResult<T, R>[]> {
  const results: BatchResult<T, R>[] = [];
  for (let start = 0; start < items.length; start += size) {
    const batch = items.slice(start, start + size);
    results.push(
      ...(await Promise.all(
        batch.map(async (item): Promise<BatchResult<T, R>> => {
          try {
            return { ok: true, item, value: await task(item) };
          } catch (e) {
            return {
              ok: false,
              item,
              error: e instanceof Error ? e.message : "Error de red",
            };
          }
        }),
      )),
    );
  }
  return results;
}

/** Los motivos de los elementos que fallaron. */
export function batchErrors<T, R>(results: BatchResult<T, R>[]): string[] {
  return results.flatMap((r) => (r.ok === false ? [r.error] : []));
}

/** Texto para el aviso cuando falla parte de un lote: cuántos y el primer motivo. */
export function batchFailureMessage(errors: string[]): string {
  return `Fallaron ${errors.length} envíos. Por ejemplo: ${errors[0]}`;
}

async function errorMessageOf(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === "string") return body.message;
  } catch {
    // no es JSON
  }
  return `Error ${res.status}`;
}

/** Descarga un certificado en PDF. `path` es la ruta del backend, p. ej. `/certificates/juror/<id>`. */
export async function downloadCertificatePdf(path: string, fileName: string): Promise<void> {
  const res = await apiFetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(await errorMessageOf(res));

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
