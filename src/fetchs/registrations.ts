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

/** Solo Administrador. Lanza si el back rechaza el cambio. */
export async function updateRegistrationsOpen(open: boolean): Promise<boolean> {
  const res = await apiFetch(`${API_URL}/settings/registrations`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ open }),
  });
  if (!res.ok) throw new Error("Error en la actualización");
  const data = (await res.json()) as { registrationsOpen: boolean };
  return data.registrationsOpen;
}
