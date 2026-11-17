import { EDITION_TIME_ZONE, isoToBogotaDate } from "@/lib/editionDate";

/**
 * Fechas y horas de registros (llegadas, «Sigo aquí», avisos) en hora de Colombia (ARK-261).
 *
 * El back las manda en UTC. Si son de hoy en Bogotá basta la hora; si son de otro día se
 * agrega el día y el mes, para que una llegada del 11/11 no parezca de hoy.
 */

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: EDITION_TIME_ZONE,
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** true si los dos instantes caen el mismo día calendario en Bogotá. */
export function isSameBogotaDay(a: string | Date, b: string | Date): boolean {
  const da = toDate(a);
  const db = toDate(b);
  if (!da || !db) return false;
  return isoToBogotaDate(da.toISOString()) === isoToBogotaDate(db.toISOString());
}

/**
 * "12:17 p. m." si es de hoy en Bogotá; "11/11, 12:17 a. m." si es de otro día.
 * `now` es la referencia de «hoy» (por defecto, el reloj del navegador; si hay hora del
 * servidor, mejor pasarla). Sin valor o inválido: "—".
 */
export function formatBogotaDateTime(
  iso: string | null | undefined,
  now: string | Date = new Date(),
): string {
  const date = toDate(iso);
  if (!date) return "—";
  const time = timeFormatter.format(date);
  if (isSameBogotaDay(date, now)) return time;
  const [, month, day] = isoToBogotaDate(date.toISOString()).split("-");
  return `${day}/${month}, ${time}`;
}

/** true si el instante ya pasó (o es justo ahora) respecto a `now`. */
export function isPastInstant(iso: string | null | undefined, now: string | Date = new Date()): boolean {
  const date = toDate(iso);
  const reference = toDate(now);
  if (!date || !reference) return false;
  return date.getTime() <= reference.getTime();
}

/**
 * Orden por instante completo (fecha y hora), el más reciente primero; los vacíos al final.
 * Compara los instantes, no el texto de la hora, así que el 11/11 a las 3 p. m. queda
 * antes que el 06/11 a las 5 p. m.
 */
export function compareInstantsDesc(a: string | null | undefined, b: string | null | undefined): number {
  const da = toDate(a);
  const db = toDate(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db.getTime() - da.getTime();
}
