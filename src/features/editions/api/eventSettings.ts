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

/** GET /settings/show-ranking: si el ranking público está publicado. */
export async function fetchShowRanking(): Promise<boolean> {
  const res = await apiFetch(`${API_URL}/settings/show-ranking`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) throw new EventSettingError(`No se pudo leer el ranking público (error ${res.status}).`, res.status);
  const body = await res.json();
  return typeof body === "boolean" ? body : body?.showRanking === true;
}

/** HU-50 (ARK-311): «Exigir código de verificación a los jurados» de la edición activa. */
export interface VerificationCodesSetting {
  verificationCodesEnabled: boolean;
  /** ISO 8601 del último cambio; null si nunca se cambió. */
  changedAt: string | null;
  changedBy: { id: string; name: string } | null;
}

const toVerificationCodesSetting = (body: unknown): VerificationCodesSetting => {
  const data = (body ?? {}) as Partial<VerificationCodesSetting>;
  return {
    // Sin el campo se asume encendido, que es el valor por defecto del back.
    verificationCodesEnabled: data.verificationCodesEnabled !== false,
    changedAt: typeof data.changedAt === "string" ? data.changedAt : null,
    changedBy: data.changedBy && typeof data.changedBy.name === "string" ? data.changedBy : null,
  };
};

/** GET /settings/verification-codes (solo Administrador). */
export async function fetchVerificationCodesSetting(): Promise<VerificationCodesSetting> {
  const res = await apiFetch(`${API_URL}/settings/verification-codes`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new EventSettingError(
      `No se pudo leer si se exige el código de verificación (error ${res.status}).`,
      res.status,
    );
  }
  return toVerificationCodesSetting(await res.json());
}

/**
 * PATCH /settings/verification-codes. Con `enabled: false` ningún equipo de la edición activa pide código.
 * No regenera códigos ni borra verificaciones. Lanza EventSettingError con el mensaje del back.
 */
export async function updateVerificationCodesSetting(enabled: boolean): Promise<VerificationCodesSetting> {
  const res = await apiFetch(`${API_URL}/settings/verification-codes`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new EventSettingError(
      typeof message === "string" && message ? message : `No se pudo guardar el cambio (error ${res.status}).`,
      res.status,
      typeof body?.code === "string" ? body.code : undefined,
    );
  }
  return toVerificationCodesSetting(body);
}
