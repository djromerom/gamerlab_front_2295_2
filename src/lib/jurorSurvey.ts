/**
 * HU-17 (ARK-184): encuesta de experiencia del jurado.
 * Preguntas, límites y validación del formulario; el back aplica las mismas reglas (ARK-183).
 */

/**
 * Estado de navegación que mandan las páginas de calificación tras un envío exitoso:
 * la página de destino consulta la encuesta y la abre si ya está disponible (CU-17, paso 2).
 */
export const JUROR_SURVEY_CHECK_STATE = { jurorSurveyCheck: true } as const;

export function hasJurorSurveyCheck(state: unknown): boolean {
  return Boolean(state && typeof state === "object" && (state as Record<string, unknown>).jurorSurveyCheck);
}

export const SURVEY_MIN_SCORE = 1;
export const SURVEY_MAX_SCORE = 5;
export const SURVEY_SCORES = [1, 2, 3, 4, 5] as const;
export const SURVEY_MAX_COMMENTS = 1000;

export type SurveyFieldKey =
  | "loginEase"
  | "groupsClarity"
  | "gradingEase"
  | "stability"
  | "fairOrganization"
  | "overall";

/** Las 6 preguntas, en el orden del formulario y del resumen (mismos textos que el back). */
export const SURVEY_QUESTIONS: ReadonlyArray<{ key: SurveyFieldKey; label: string }> = [
  { key: "loginEase", label: "Facilidad para iniciar sesión y entrar a la plataforma" },
  { key: "groupsClarity", label: "Claridad para saber qué grupos evaluar" },
  { key: "gradingEase", label: "Facilidad para calificar (formulario de evaluación)" },
  { key: "stability", label: "Estabilidad y rapidez (no perdí datos, no se cerró la sesión)" },
  { key: "fairOrganization", label: "Organización de la feria (escarapela, registro y avisos)" },
  { key: "overall", label: "Experiencia general" },
];

export type SurveyAnswers = Record<SurveyFieldKey, number | null>;

export interface SurveyPayload extends Record<SurveyFieldKey, number> {
  comments?: string;
}

export const emptySurveyAnswers = (): SurveyAnswers => ({
  loginEase: null,
  groupsClarity: null,
  gradingEase: null,
  stability: null,
  fairOrganization: null,
  overall: null,
});

/** Preguntas sin responder, en el orden del formulario. */
export function missingSurveyAnswers(answers: SurveyAnswers): SurveyFieldKey[] {
  return SURVEY_QUESTIONS.map((q) => q.key).filter((key) => answers[key] === null);
}

/**
 * Cuerpo del `POST /juror-survey`. Null si falta alguna pregunta.
 * El comentario va sin espacios a los lados y se omite si queda vacío.
 */
export function buildSurveyPayload(answers: SurveyAnswers, comments: string): SurveyPayload | null {
  if (missingSurveyAnswers(answers).length > 0) return null;
  const payload = {} as SurveyPayload;
  for (const { key } of SURVEY_QUESTIONS) payload[key] = answers[key] as number;
  const trimmed = comments.trim();
  if (trimmed) payload.comments = trimmed;
  return payload;
}

/** Porcentaje (0-100, entero) de una nota dentro de la distribución de una pregunta. */
export function distributionPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** Promedio para mostrar: "4,3" (una cifra decimal, coma decimal) o "—" sin respuestas. */
export function formatSurveyAverage(average: number | null): string {
  if (average === null || Number.isNaN(average)) return "—";
  return average.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
