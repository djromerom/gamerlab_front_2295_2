/**
 * BG-30 (ARK-255): las notas se muestran siempre con 2 decimales («4.55», «3.00»).
 * Acepta número o texto (el back puede mandar el decimal como texto); sin nota, «—».
 */
export function formatScore(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "—";
}
