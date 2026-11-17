import { isIosDevice, isPwaInstalled } from "@/lib/pwa";

export function base64UrlToUint8Array(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const bytes = atob(padded);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

export function isPushSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "Notification" in window
    && "PushManager" in window;
}

export async function getPushRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.getRegistration("/");
}

/**
 * Suscripción push de este navegador, o null si no hay. En Safari de iPhone o iPad sin la app instalada el service
 * worker existe pero no trae pushManager: antes eso lanzaba «undefined is not an object (evaluating
 * 'l.pushManager.getSubscription')».
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getPushRegistration();
  if (!registration?.pushManager) return null;
  return registration.pushManager.getSubscription();
}

/** iPhone o iPad (también el iPad con iPadOS, que se presenta como Mac) sin ARKAD instalada como aplicación. */
export function requiresInstalledPwa() {
  return isIosDevice() && !isPwaInstalled();
}

export type PushAvailability = "supported" | "needsInstall" | "unsupported";

/** Si este navegador puede recibir avisos, necesita instalar la app primero (iOS) o no es compatible. */
export function pushAvailability(): PushAvailability {
  if (requiresInstalledPwa()) return "needsInstall";
  return isPushSupported() ? "supported" : "unsupported";
}

export const NEEDS_INSTALL_MESSAGE =
  "Para recibir avisos en el iPhone o iPad, primero instala ARKAD como aplicación: en Safari toca Compartir y luego «Agregar a pantalla de inicio». Después abre ARKAD desde ese ícono y activa las notificaciones.";
export const UNSUPPORTED_MESSAGE =
  "Este navegador no es compatible con las notificaciones. Usa Chrome, Edge o Firefox, o instala ARKAD como aplicación.";
