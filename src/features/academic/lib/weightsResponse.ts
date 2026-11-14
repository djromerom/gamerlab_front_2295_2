/**
 * ARK-130 (HU-27): respuesta de `GET /settings/weights` (ponderados de la edición activa).
 * El back siempre responde JSON:
 * - 200 con `{ seniorPct, juniorPct, ... }`;
 * - 404 `NO_ACTIVE_EDITION` si no hay edición activa;
 * - 404 `WEIGHTS_NOT_CONFIGURED` si la edición activa aún no tiene ponderados.
 */
export type WeightsLoad =
  | { kind: "loaded"; seniorPct: number; juniorPct: number }
  | { kind: "empty" }
  | { kind: "no-active-edition"; message: string }
  | { kind: "error"; message: string };

const NO_ACTIVE_EDITION_FALLBACK = "No hay una edición activa. Actívala en Ediciones antes de continuar.";

export function interpretWeightsResponse(status: number, body: unknown): WeightsLoad {
  const data = (typeof body === "object" && body !== null ? body : {}) as {
    code?: unknown;
    message?: unknown;
    seniorPct?: unknown;
    juniorPct?: unknown;
  };
  const message = typeof data.message === "string" ? data.message : undefined;

  if (status >= 200 && status < 300) {
    return typeof data.seniorPct === "number" && typeof data.juniorPct === "number"
      ? { kind: "loaded", seniorPct: data.seniorPct, juniorPct: data.juniorPct }
      : { kind: "empty" };
  }
  if (status === 404 && data.code === "NO_ACTIVE_EDITION") {
    return { kind: "no-active-edition", message: message ?? NO_ACTIVE_EDITION_FALLBACK };
  }
  if (status === 404 && data.code === "WEIGHTS_NOT_CONFIGURED") return { kind: "empty" };
  return { kind: "error", message: message ?? `No se pudieron cargar los porcentajes (error ${status}).` };
}
