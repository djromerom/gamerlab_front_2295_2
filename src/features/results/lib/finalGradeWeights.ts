/**
 * HU-34 (ARK-255): texto de la ponderación de la nota final.
 * La nota final mezcla el promedio de los profesores con el de los jurados **junior**.
 */
export const formatFinalGradeWeighting = (
  seniorPct: number,
  juniorPct: number,
) => `Nota final: ${seniorPct} % profesores y ${juniorPct} % jurados junior`;

/**
 * Regla vigente (P-02, 6-nov): 60 % profesores y 40 % jurados junior.
 * Solo el Administrador puede leer la ponderación configurada (`GET /settings/weights`), así que
 * el ranking público y el panel del profesor muestran esta regla. Si se cambia la ponderación de la
 * edición, hay que cambiarla aquí también (o que el back la exponga a esos roles).
 */
export const DEFAULT_FINAL_GRADE_WEIGHTS = { seniorPct: 60, juniorPct: 40 } as const;

export const DEFAULT_FINAL_GRADE_WEIGHTING_TEXT = formatFinalGradeWeighting(
  DEFAULT_FINAL_GRADE_WEIGHTS.seniorPct,
  DEFAULT_FINAL_GRADE_WEIGHTS.juniorPct,
);
