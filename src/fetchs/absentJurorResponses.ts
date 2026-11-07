import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type AbsentJurorResult = "ON_THE_WAY" | "CANNOT_ATTEND" | "NO_RESPONSE";

export interface AbsentJurorResponse {
  id: number;
  jurorId: string;
  result: AbsentJurorResult;
  estimatedArrivalAt: string | null;
  recordedAt: string;
  recordedBy: { id: string; name: string };
}

export interface AbsentJurorHistory {
  edition: { id: number; title: string };
  juror: { id: string; name: string; category: "Senior" | "Junior" | "Sin categoría" };
  data: AbsentJurorResponse[];
}

export interface RecordAbsentJurorResponse {
  jurorId: string;
  result: AbsentJurorResult;
  estimatedArrivalAt?: string;
}

export class AbsentJurorResponseError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AbsentJurorResponseError";
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (Array.isArray(body?.message)) return body.message.join(", ");
  } catch {
    // Keep the endpoint-specific fallback for non-JSON responses.
  }
  return fallback;
}

export async function fetchAbsentJurorHistory(jurorId: string): Promise<AbsentJurorHistory> {
  const response = await apiFetch(`${API_URL}/absent-juror-responses/${encodeURIComponent(jurorId)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new AbsentJurorResponseError("No tienes permiso para ver las respuestas", 403);
    }
    throw new AbsentJurorResponseError(
      await readError(response, "No se pudo cargar el historial de respuestas."),
      response.status,
    );
  }
  return response.json();
}

export async function recordAbsentJurorResponse(
  payload: RecordAbsentJurorResponse,
): Promise<AbsentJurorResponse> {
  const response = await apiFetch(`${API_URL}/absent-juror-responses`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new AbsentJurorResponseError("No tienes permiso para registrar respuestas", 403);
    }
    if (response.status === 409) {
      throw new AbsentJurorResponseError("Este jurado ya llegó", 409);
    }
    throw new AbsentJurorResponseError(
      await readError(response, "No se pudo guardar la respuesta."),
      response.status,
    );
  }
  return response.json();
}
