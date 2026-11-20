/**
 * BG-71 (ARK-285 back / ARK-286 front): un jurado asignado solo puede calificar si registró su
 * llegada en la mesa de ARKAD. Sin llegada, el envío individual, el lote y el guardado del
 * borrador responden 409 con este `code`. Se distingue por `code`, no por el status: un 409 del
 * borrador también puede ser DRAFT_VERSION_CONFLICT o EVALUATION_ALREADY_SUBMITTED.
 */
export const JUROR_NOT_CHECKED_IN = "JUROR_NOT_CHECKED_IN";

export const NOT_CHECKED_IN_MESSAGE = "Registra tu llegada en la mesa de ARKAD para poder calificar.";

/** La respuesta es el 409 de «sin llegada registrada». */
export function isJurorNotCheckedIn(status: number, body: unknown): boolean {
  return status === 409 && (body as { code?: unknown } | null)?.code === JUROR_NOT_CHECKED_IN;
}
