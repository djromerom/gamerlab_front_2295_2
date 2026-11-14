import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type EvaluationTrackingLevel = "N0" | "N1" | "N2" | "N3" | "N4";

export interface HourBucket {
  hour: number;
  received: number;
  counted: number;
}

export interface GroupTracking {
  teamId: number;
  teamCode: string;
  teamName: string;
  videogame: string;
  level: EvaluationTrackingLevel | null;
  assignedJurors: number;
  presentJurors: number;
  evaluationsReceived: number;
  evaluationsCounted: number;
  byHour: HourBucket[];
  belowMinimumAt11: boolean;
}

export interface EvaluationTrackingResult {
  editionId: number;
  date: string;
  generatedAt: string;
  hours: number[];
  groups: GroupTracking[];
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string") return body.message;
    if (Array.isArray(body?.message)) return body.message.join(", ");
  } catch {
    // Use the endpoint-specific fallback for non-JSON responses.
  }
  return fallback;
}

export async function fetchEvaluationTracking(
  level?: EvaluationTrackingLevel,
  date?: string,
): Promise<EvaluationTrackingResult> {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (date) params.set("date", date);
  const query = params.toString();

  const response = await apiFetch(`${API_URL}/evaluation-tracking${query ? `?${query}` : ""}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("No tienes permiso para ver el seguimiento");
    }
    if (response.status === 404) {
      throw new Error("No hay una feria activa");
    }
    throw new Error(await readError(response, `No se pudo cargar el seguimiento (${response.status})`));
  }

  return response.json();
}
