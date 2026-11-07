import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export interface PushPublicKey {
  enabled: boolean;
  publicKey: string | null;
}

export interface PushStatus {
  enabled: boolean;
  devices: number;
}

export interface PushSubscribeResult {
  subscribed: boolean;
  devices: number;
}

export interface PushNoticeCounts {
  devices: number;
  sent: number;
  expired: number;
  failed: number;
}

export interface PushNoticeResult {
  edition: { id: number; title: string };
  totals: PushNoticeCounts & { jurors: number };
  results: Array<PushNoticeCounts & { jurorId: string }>;
}

async function readError(response: Response, fallback: string) {
  let data: { message?: string | string[]; code?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // Use the fallback below when the backend does not return JSON.
  }

  if (response.status === 400 && data?.message instanceof Array) {
    throw new Error(data.message.join(". "));
  }
  throw new Error(typeof data?.message === "string" ? data.message : fallback);
}

export async function getPushPublicKey() {
  const response = await apiFetch(`${API_URL}/push/public-key`);
  if (!response.ok) return Promise.reject(new Error("No se pudo consultar la configuración de notificaciones"));
  return response.json() as Promise<PushPublicKey>;
}

export async function getPushStatus() {
  const response = await apiFetch(`${API_URL}/push/status`);
  if (!response.ok) return Promise.reject(new Error("No se pudo consultar las notificaciones"));
  return response.json() as Promise<PushStatus>;
}

export async function subscribeToPush(subscription: PushSubscriptionJSON) {
  const response = await apiFetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) await readError(response, "No se pudieron activar las notificaciones");
  return response.json() as Promise<PushSubscribeResult>;
}

export async function unsubscribeFromPush(endpoint: string) {
  const response = await apiFetch(`${API_URL}/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  if (!response.ok) await readError(response, "No se pudieron desactivar las notificaciones");
  return response.json() as Promise<PushSubscribeResult>;
}

async function sendNotice(path: string) {
  const response = await apiFetch(`${API_URL}${path}`, {
    method: "POST",
  });
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error("Las notificaciones no están configuradas");
    }
    await readError(response, "No se pudo enviar el aviso");
  }
  return response.json() as Promise<PushNoticeResult>;
}

export const sendArrivalReminder = () => sendNotice("/push/notices/arrival-reminder");
export const sendPendingEvaluationsNotice = () => sendNotice("/push/notices/pending-evaluations");
