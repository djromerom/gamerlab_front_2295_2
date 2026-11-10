import { clearAllBackups } from "@/lib/evaluationDrafts";
import { clearGradeDraft } from "@/lib/gradeDrafts";

/**
 * BG-08 / BG-27 (ARK-146): dueño de lo que hay sin guardar en este navegador
 * (copias locales de evaluaciones del jurado y notas del profesor).
 *
 * Al vencer la sesión se conserva todo para que la misma persona retome al volver a entrar;
 * si entra otra persona, se borra antes de que llegue a verlo.
 */

export const LOCAL_DRAFTS_OWNER_KEY = "local-drafts-owner";

/** Borra todo lo guardado sin enviar en este navegador (al cerrar sesión). */
export function clearAllLocalDrafts(): void {
  clearAllBackups();
  clearGradeDraft();
  try {
    localStorage.removeItem(LOCAL_DRAFTS_OWNER_KEY);
  } catch {
    /* ignorar */
  }
}

/**
 * Se llama al conocer al usuario de la sesión, antes de mostrar sus pantallas.
 * Si lo guardado es de otra persona (o de dueño desconocido), se borra.
 */
export function claimLocalDrafts(userId: string): void {
  let owner: string | null = null;
  try {
    owner = localStorage.getItem(LOCAL_DRAFTS_OWNER_KEY);
  } catch {
    return; // sin almacenamiento tampoco hay borradores que proteger
  }
  if (owner !== userId) {
    clearAllBackups();
    clearGradeDraft();
  }
  try {
    localStorage.setItem(LOCAL_DRAFTS_OWNER_KEY, userId);
  } catch {
    /* ignorar */
  }
}
