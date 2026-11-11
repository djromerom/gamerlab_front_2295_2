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

// BG-32 (ARK-148): rangos de la etiqueta de la nota final, definidos por Allison el 7-nov.
// Escala 0 a 5; el límite inferior de cada rango está incluido.
const GRADE_LABELS: ReadonlyArray<{ min: number; label: string }> = [
  { min: 4.5, label: "Excelente" },
  { min: 4, label: "Muy bueno" },
  { min: 3.5, label: "Bueno" },
  { min: 3, label: "Aceptable" },
  { min: 0, label: "Insuficiente" },
];

/** Etiqueta de la nota final según los rangos de BG-32. La nota se redondea a 2 decimales antes. */
export function gradeLabel(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = roundGrade(value);
  return GRADE_LABELS.find((r) => rounded >= r.min)?.label ?? GRADE_LABELS[GRADE_LABELS.length - 1].label;
}
