import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND;

/** Público. Lanza si la petición falla. */
export async function readRegistrationsOpen(): Promise<boolean> {
  const res = await fetch(`${API_URL}/settings/registrations`);
  if (!res.ok) throw new Error("Error al leer las inscripciones");
  const data = (await res.json()) as { registrationsOpen?: unknown };
  return data.registrationsOpen === true;
}

/** Público. Si la petición falla se considera cerrado. */
export async function fetchRegistrationsOpen(): Promise<boolean> {
  try {
    return await readRegistrationsOpen();
  } catch {
    return false;
  }
}

/**
 * Mensaje del back (`message`, texto o lista de validación) con el código HTTP. Sin cuerpo JSON
 * o sin `message`, el texto de respaldo con el código. Así el administrador distingue un 404 de
 * un 403 en vez de ver siempre el mismo aviso (ARK-123).
 */
async function errorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const raw = (await res.json())?.message;
    const message = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : "";
    if (message) return `${message} (${res.status})`;
  } catch {
    // Cuerpo vacío o que no es JSON: se usa el texto de respaldo.
  }
  return `${fallback} (${res.status})`;
}

/** Solo Administrador. Lanza si el back rechaza el cambio. */
export async function updateRegistrationsOpen(open: boolean): Promise<boolean> {
  const res = await apiFetch(`${API_URL}/settings/registrations`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ open }),
  });
  if (!res.ok) throw new Error(await errorDetail(res, "Error en la actualización"));
  const data = (await res.json()) as { registrationsOpen: boolean };
  return data.registrationsOpen;
}
