import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** Error de un interruptor de la configuración del evento, con el código del back si lo trae. */
export class EventSettingError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "EventSettingError";
  }
}

/** BG-67 (ARK-268): publicar el ranking antes de liberar la nota final responde 400 con este código. */
export const RANKING_REQUIRES_FINAL_GRADE = "RANKING_REQUIRES_FINAL_GRADE";

/**
 * Cambia un interruptor de la configuración del evento (PATCH /settings/...). Si el back rechaza el cambio,
 * lanza EventSettingError con su mensaje en español (por ejemplo, «Primero libera la nota final; el ranking se
 * publica después.»).
 */
export async function updateEventSetting(path: string, field: string, value: boolean): Promise<void> {
  const res = await apiFetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  if (res.ok) return;
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
  throw new EventSettingError(
    typeof message === "string" && message ? message : `No se pudo guardar el cambio (error ${res.status}).`,
    res.status,
    typeof body?.code === "string" ? body.code : undefined,
  );
}
