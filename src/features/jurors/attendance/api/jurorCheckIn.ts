import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type JurorCategoryLabel = "Junior" | "Senior" | "Sin categoría";
export type CheckInStatus = "CHECKED_IN" | "ALREADY_CHECKED_IN";
export type CheckInMethod = "QR" | "MANUAL";

export interface CheckInResult {
  status: CheckInStatus;
  checkedInAt: string;
  method: CheckInMethod;
  juror: {
    id: string;
    name: string;
    category: JurorCategoryLabel;
    teams: { id: number; name: string }[];
  };
}

export interface JurorSearchItem {
  id: string;
  name: string;
  category: JurorCategoryLabel;
  hasBadge: boolean;
  checkedInAt: string | null;
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (Array.isArray(body?.message)) return body.message.join(", ");
  } catch {
    // The fallback is more useful when the response is not JSON.
  }
  return fallback;
}

export async function scanJurorBadge(token: string): Promise<CheckInResult> {
  const response = await apiFetch(`${API_URL}/juror-checkin/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "Código QR no válido"));
  return response.json();
}

/**
 * Jurado de una escarapela, sin registrar la llegada: el QR es un token opaco, así que hay que preguntarle al back
 * de quién es para pedir confirmación antes de registrar (ARK-252). Ruta del back de Samuel (fix/ARK-251-badge-preview,
 * #307; contrato BG-49, «Vista previa del QR»). En un servidor sin la ruta, el escaneo pide buscar por nombre.
 */
export interface BadgePreview {
  juror: CheckInResult["juror"];
  /** Si ya llegó, la hora de su llegada activa (ISO UTC). */
  checkedInAt: string | null;
}

export const QR_PREVIEW_UNAVAILABLE =
  "Leer el QR todavía no está disponible en este servidor. Busca al jurado por nombre en «Registro manual».";

export async function previewJurorBadge(token: string): Promise<BadgePreview> {
  const response = await apiFetch(`${API_URL}/juror-checkin/badge?token=${encodeURIComponent(token.trim())}`);
  if (!response.ok) {
    const message = await errorMessage(response, "Código QR no válido");
    // Back sin la ruta todavía: Nest responde «Cannot GET …», que no le sirve al Staff
    if (response.status === 404 && message.startsWith("Cannot GET")) throw new Error(QR_PREVIEW_UNAVAILABLE);
    throw new Error(message);
  }
  return response.json();
}

export async function searchJurors(query: string): Promise<JurorSearchItem[]> {
  const response = await apiFetch(`${API_URL}/juror-checkin/search?q=${encodeURIComponent(query.trim())}`);
  if (!response.ok) throw new Error(await errorMessage(response, "No se pudo buscar al jurado"));
  return response.json();
}

export async function checkInJurorManually(jurorId: string): Promise<CheckInResult> {
  const response = await apiFetch(`${API_URL}/juror-checkin/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jurorId }),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "No se pudo registrar la llegada"));
  return response.json();
}

export async function createStaff(input: { email: string; firstName: string; lastName: string }) {
  const response = await apiFetch(`${API_URL}/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "No se pudo crear la cuenta Staff"));
  return response.json();
}
