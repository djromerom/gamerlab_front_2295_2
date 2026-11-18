/**
 * ARK-248 (BG-58): edición que abre «Ediciones pasadas» por defecto.
 *
 * Antes se abría la primera de la lista que no fuera ACTIVE, y en test esa era una edición de
 * prueba con fecha futura. Ahora se abre la que terminó más recientemente; si ninguna terminó,
 * la que está en curso; y si todas son futuras, ninguna (la página lo dice y deja elegir).
 */
export function pickDefaultPastEdition<T extends { startsAt: string; endsAt: string }>(
  editions: T[],
  now: Date = new Date(),
): T | null {
  const nowMs = now.getTime();
  const byLatest = (field: "startsAt" | "endsAt") => (a: T, b: T) => Date.parse(b[field]) - Date.parse(a[field]);

  const finished = editions.filter((edition) => Date.parse(edition.endsAt) < nowMs).sort(byLatest("endsAt"));
  if (finished.length > 0) return finished[0];

  const started = editions.filter((edition) => Date.parse(edition.startsAt) <= nowMs).sort(byLatest("startsAt"));
  return started[0] ?? null;
}
