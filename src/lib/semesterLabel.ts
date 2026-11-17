/**
 * Etiqueta del semestre de una edición (BG-63, ARK-263). Igual que el back:
 * `Edition.semester` 10 = primer semestre («1»), 20 = intersemestral, 30 = segundo semestre («2»).
 * Cualquier otro valor se muestra tal cual.
 */
export function semesterLabel(semester: number): string {
  if (semester === 10) return "1";
  if (semester === 20) return "Intersemestral";
  if (semester === 30) return "2";
  return String(semester);
}

/** Etiqueta completa de la feria: «2026 - 2», «2026 - 1», «2026 - Intersemestral». */
export function editionSemesterLabel(edition: { year: number; semester: number }): string {
  return `${edition.year} - ${semesterLabel(edition.semester)}`;
}
