/**
 * HU-22 (ARK-85): explicación para el jurado suplente y su «Entendido».
 * El back no guarda el «Entendido» (contrato ARK-84): queda en el navegador, por usuario y edición.
 */
import type { MySubstituteNotices, SubstituteNotice } from "@/features/jurors/substitutes/api/substituteNotices";

/** Ruta de los grupos que el jurado tiene por calificar (el botón «Ver mis grupos»). */
export const PENDING_GRADING_PATH = "/pendientes-calificar";

export const SUBSTITUTE_GUIDE_TITLE = "Eres jurado suplente";

export const SUBSTITUTE_GUIDE_INTRO =
  "Estás de reserva para cubrir los grupos de un jurado que no llegue o que se retire. Puede que evalúes uno, varios o ningún grupo.";

export const SUBSTITUTE_GUIDE_STEPS_TITLE = "Qué puede pasar durante la feria:";

export const SUBSTITUTE_GUIDE_STEPS: readonly string[] = [
  "Haz tu registro en la mesa de escarapelas desde las 8:00 y mantén la plataforma abierta: así sabemos que estás disponible.",
  "A las 10:00 el equipo organizador revisa qué jurados no han llegado. A las 11:00 hace el control definitivo y, si un grupo se queda sin cobertura, puede asignarte sus grupos en ese momento o más tarde.",
  "Cuando te asignen grupos recibirás un aviso en la plataforma y un correo con el mensaje \"Te asignaron grupos\". Entra, revisa el nombre y el nivel de cada grupo y pídele a cada equipo su código de verificación: sin ese código no puedes calificar.",
  "Tus grupos se suman a los del jurado ausente. Si esa persona llega después, también evaluará los suyos, así que nadie pierde su trabajo. En cada grupo solo se promedian las tres primeras evaluaciones enviadas; las demás se guardan igual y cuentan como cumplimiento tuyo.",
  "Puede ocurrir que no te asignen ningún grupo. Tu disponibilidad es valiosa de todas formas.",
  "La feria termina alrededor de las 12:00. Tu avance se guarda automáticamente; si se interrumpe tu conexión, vuelve a entrar y continúa donde quedaste.",
];

const STORAGE_PREFIX = "arkad:substitute-guide";

export const guideStorageKey = (userId: string, editionId: number) => `${STORAGE_PREFIX}:${userId}:${editionId}`;

/** El almacenamiento puede no existir o fallar (ventana privada, datos bloqueados). */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasAcknowledgedGuide(userId: string, editionId: number): boolean {
  try {
    const store = storage();
    return store !== null && store.getItem(guideStorageKey(userId, editionId)) !== null;
  } catch {
    return false;
  }
}

/** Devuelve false si no se pudo guardar: la explicación volverá a salir en el próximo ingreso. */
export function acknowledgeGuide(userId: string, editionId: number, now: Date = new Date()): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(guideStorageKey(userId, editionId), now.toISOString());
    return true;
  } catch {
    return false;
  }
}

/**
 * ¿Es suplente en la edición activa? Si el back manda `isSubstitute`, manda eso. Si no (contrato
 * actual), solo se sabe cuando ya tiene algún aviso, leído o no: un jurado oficial nunca tiene.
 */
export function isSubstituteJuror(result: MySubstituteNotices | null): boolean {
  if (!result) return false;
  if (typeof result.isSubstitute === "boolean") return result.isSubstitute;
  return result.data.length > 0 || result.unreadCount > 0;
}

export const unreadNotices = (notices: SubstituteNotice[]) => notices.filter((notice) => notice.readAt === null);

/** "1 grupo" / "3 grupos". */
export const groupsLabel = (n: number) => `${n} grupo${n === 1 ? "" : "s"}`;
