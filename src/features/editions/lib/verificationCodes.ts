import type { VerificationCodesSetting } from "@/features/editions/api/eventSettings";

export const VERIFICATION_CODES_CARD_TITLE = "Exigir código de verificación a los jurados";

export const VERIFICATION_CODES_SUBTITLE =
  "El jurado digita el código del equipo antes de calificar. Apagado, ningún equipo de la edición activa lo pide.";

export const VERIFICATION_CODES_HINT =
  "Al volver a encenderlo, los equipos con el código desactivado en Equipos inscritos siguen sin pedirlo. No se regeneran códigos ni se borran verificaciones.";

/** «Último cambio: Allison Ruiz, el 21/11/2026, 3:10 p. m. (hora de Colombia).» o null si nunca se cambió. */
export function verificationCodesChangeMessage(setting: VerificationCodesSetting): string | null {
  if (!setting.changedAt) return null;
  const date = new Date(setting.changedAt);
  if (Number.isNaN(date.getTime())) return null;
  const when = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(date);
  const who = setting.changedBy?.name ? `${setting.changedBy.name}, ` : "";
  return `Último cambio: ${who}el ${when} (hora de Colombia).`;
}
