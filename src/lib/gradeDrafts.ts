import type { GradeTeam } from "@/components/grupo 5/student-grade-table-types";

/**
 * BG-27 (ARK-146): notas del profesor editadas y aún sin guardar, conservadas en el
 * navegador para retomarlas al recargar o al volver a abrir la pestaña.
 * Las notas del profesor no tienen borrador en el servidor (HU-18 cubre solo las
 * evaluaciones del jurado); se guardan en localStorage y se borran al guardar o descartar.
 */

export interface GradeDraft {
  /** Feria y NRC seleccionados al editar, para volver a la misma tabla. */
  fair: string;
  nrc: string;
  /** Nota escrita por fila (clave `gradeKey`), solo las modificadas. */
  grades: Record<string, string>;
  /** Fila tal como estaba al editarla: puede ser de otra página de la tabla. */
  teams: Record<string, GradeTeam>;
  savedAt: number;
}

export const GRADE_DRAFT_KEY = "teacher-grades-draft";

/** true si se pudo guardar (falla con el almacenamiento lleno o bloqueado). */
export function writeGradeDraft(draft: Omit<GradeDraft, "savedAt">): boolean {
  try {
    localStorage.setItem(GRADE_DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function readGradeDraft(): GradeDraft | null {
  try {
    const raw = localStorage.getItem(GRADE_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<GradeDraft>;
    if (!data || typeof data.grades !== "object" || !data.grades || typeof data.teams !== "object" || !data.teams) {
      return null;
    }
    const grades: Record<string, string> = {};
    const teams: Record<string, GradeTeam> = {};
    for (const [key, value] of Object.entries(data.grades)) {
      const team = (data.teams as Record<string, GradeTeam | undefined>)[key];
      // Sin la fila no se sabe a qué videojuego corresponde la nota.
      if (typeof value === "string" && team && typeof team === "object") {
        grades[key] = value;
        teams[key] = team;
      }
    }
    if (Object.keys(grades).length === 0) return null;
    return {
      fair: typeof data.fair === "string" ? data.fair : "",
      nrc: typeof data.nrc === "string" ? data.nrc : "",
      grades,
      teams,
      savedAt: typeof data.savedAt === "number" ? data.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearGradeDraft(): void {
  try {
    localStorage.removeItem(GRADE_DRAFT_KEY);
  } catch {
    /* ignorar */
  }
}

/** Nota escrita distinta de la guardada en el servidor (misma regla que «Modificada» en la tabla). */
export function isGradeModified(raw: string | undefined, original: number | null | undefined): boolean {
  const value = (raw ?? "").trim();
  if (value === "") return original != null;
  const numeric = Number(value);
  return !Number.isFinite(numeric) || original == null || numeric !== original;
}
