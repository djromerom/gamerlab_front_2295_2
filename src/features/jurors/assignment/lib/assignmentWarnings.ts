/**
 * HU-08 (ARK-102/ARK-103): advertencias de las reglas de asignación de jurados.
 * El back responde 409 con `code: "ASSIGNMENT_WARNINGS"` y no guarda nada; el admin
 * puede repetir la misma petición con `confirmWarnings: true` para guardar igual.
 * Los bloqueos (400, o el 409 por duplicado, que no trae ese `code`) no se pueden saltar.
 */
export const ASSIGNMENT_WARNINGS_CODE = "ASSIGNMENT_WARNINGS";

export type AssignmentWarningCode =
  | "JUROR_OVER_LIMIT"
  | "JUROR_MIXED_LEVELS"
  | "TEAM_UNDER_MIN"
  | "NRC_CONFLICT"
  | "VALIDATION_UNAVAILABLE";

export interface AssignmentWarning {
  code: AssignmentWarningCode | (string & {});
  message: string;
  jurorId?: string;
  details?: Record<string, unknown>;
}

export class AssignmentWarningsError extends Error {
  readonly warnings: AssignmentWarning[];

  constructor(message: string, warnings: AssignmentWarning[]) {
    super(message);
    this.name = "AssignmentWarningsError";
    this.warnings = warnings;
  }
}

/**
 * Advertencias de una respuesta 409 `ASSIGNMENT_WARNINGS`. Null para cualquier
 * otro error: se distingue por el `code`, no solo por el status.
 */
export function getAssignmentWarnings(
  status: number,
  body: unknown
): AssignmentWarning[] | null {
  if (status !== 409 || !body || typeof body !== "object") return null;

  const { code, warnings } = body as { code?: unknown; warnings?: unknown };
  if (code !== ASSIGNMENT_WARNINGS_CODE || !Array.isArray(warnings)) return null;

  return warnings.filter(
    (warning): warning is AssignmentWarning =>
      typeof warning?.message === "string" && typeof warning?.code === "string"
  );
}

/** El back no pudo comprobar las reglas: el caso de uso pide una confirmación más explícita. */
export function isValidationUnavailable(warnings: AssignmentWarning[]): boolean {
  return warnings.some((warning) => warning.code === "VALIDATION_UNAVAILABLE");
}
