// BG-30 (P-04): toda nota se muestra con 2 decimales en todas las pantallas (3.50, 3.54).

/** Nota con 2 decimales, o null si no es un número finito. Acepta números en texto. */
export function formatGrade(value: number | string | null | undefined): string | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : null;
}

/** La misma nota redondeada a 2 decimales, como número (para comparar contra umbrales). */
export function roundGrade(value: number): number {
  return Number(value.toFixed(2));
}
