// Margen fijo antes del vencimiento del access token para renovarlo (HU-05).
// Con el token de 15 min de producción, la renovación ocurre cada 10 min.
export const REFRESH_MARGIN_MS = 5 * 60 * 1000;

// Vida del access token si el backend no envía accessTokenExpiresIn.
export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN_S = 15 * 60;

// Espera antes de reintentar una renovación que falló por red o por error del servidor.
export const REFRESH_RETRY_DELAY_MS = 30 * 1000;

// Evento que emite apiFetch cuando el backend rechaza el refresh token.
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/**
 * Milisegundos a esperar antes de renovar un access token que vence en
 * `expiresInSeconds`. Si el valor no es válido, usa la vida por defecto.
 * Si el token dura menos que el margen, renueva a la mitad de su vida.
 */
export function getRefreshDelayMs(expiresInSeconds?: unknown): number {
  const seconds =
    typeof expiresInSeconds === "number" &&
    Number.isFinite(expiresInSeconds) &&
    expiresInSeconds > 0
      ? expiresInSeconds
      : DEFAULT_ACCESS_TOKEN_EXPIRES_IN_S;
  const expiresInMs = seconds * 1000;

  if (expiresInMs <= REFRESH_MARGIN_MS) {
    return expiresInMs / 2;
  }
  return expiresInMs - REFRESH_MARGIN_MS;
}
