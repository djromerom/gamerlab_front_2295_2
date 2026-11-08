/**
 * Fechas y horas de las ediciones, siempre en hora de Colombia.
 *
 * La feria ocurre en Bogotá: las horas se guardan y se muestran en
 * `America/Bogota`, sin importar la zona horaria del navegador (ARK-157).
 * Colombia está en UTC-5 todo el año (no tiene horario de verano).
 */
export const EDITION_TIME_ZONE = "America/Bogota";
const BOGOTA_UTC_OFFSET = "-05:00";

/**
 * Fecha de una edición con el formato de «Información»: "Jueves 14 de mayo".
 * `withYear` agrega el año (ediciones pasadas): "Jueves 15 de mayo de 2025".
 */
export function formatEditionDate(
  isoString?: string | null,
  options: { withYear?: boolean } = {},
): string {
  if (!isoString) return "Por Definir";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Fecha Inválida";
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(options.withYear ? { year: "numeric" } : {}),
    timeZone: EDITION_TIME_ZONE,
  }).format(date);
  return formatted.replace(",", "").replace(/^\w/, (c) => c.toUpperCase());
}

/** Hora de una edición con el formato de «Información»: "08:30 am". */
export function formatEditionTime(isoString?: string | null): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: EDITION_TIME_ZONE,
  })
    .format(date)
    .toLowerCase();
}

/**
 * Combina una fecha (YYYY-MM-DD) y una hora (HH:mm) de Bogotá en un ISO UTC.
 * Ejemplo: bogotaToISO("2025-11-27", "08:30") → "2025-11-27T13:30:00.000Z"
 */
export function bogotaToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00${BOGOTA_UTC_OFFSET}`).toISOString();
}

function bogotaParts(iso: string): Record<"year" | "month" | "day" | "hour" | "minute", string> | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDITION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** Fecha (YYYY-MM-DD) de un ISO, vista en Bogotá. */
export function isoToBogotaDate(iso: string): string {
  if (!iso) return "";
  const p = bogotaParts(iso);
  return p ? `${p.year}-${p.month}-${p.day}` : iso.substring(0, 10);
}

/** Hora (HH:mm, 24 h) de un ISO, vista en Bogotá. */
export function isoToBogotaTime(iso: string): string {
  if (!iso) return "";
  const p = bogotaParts(iso);
  return p ? `${p.hour}:${p.minute}` : iso.substring(11, 16);
}
