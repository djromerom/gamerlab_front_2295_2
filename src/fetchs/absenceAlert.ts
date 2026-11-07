import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type FairPhase = "NOT_CONFIGURED" | "BEFORE_ALERT" | "ALERT" | "CONTROL" | "CLOSED";
export type JurorAttendanceState = "NO_CHECK_IN" | "PRESENT" | "ABSENT";
export type JurorType = "OFFICIAL" | "BACKUP" | null;

export interface EditionSummary {
  id: number;
  title: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  writable: boolean;
}

export interface FairSchedule {
  fairDate: string | null;
  startTime: string;
  alertTime: string;
  controlTime: string;
  closeTime: string;
}

export interface AlertJuror {
  jurorId: string;
  name: string;
  category: "Senior" | "Junior" | "Sin categoría";
  isProfessor: boolean;
  type: JurorType;
  state: JurorAttendanceState;
  checkedInAt: string | null;
  hasEvaluated?: boolean;
}

export interface AlertGroup {
  teamId: number;
  teamCode: string;
  teamName: string;
  videogame: string;
  level: string | null;
  assignedJurors: number;
  presentJurors: number;
  evaluationsCounted: number;
  missingEvaluations: number;
  jurors?: AlertJuror[];
}

export interface AbsenceAlertResult {
  edition: EditionSummary;
  schedule: FairSchedule;
  phase: FairPhase;
  alertActive: boolean;
  generatedAt: string;
  totals: { present: number; missing: number; total: number };
  missingJurors: AlertJuror[];
  groups: AlertGroup[];
}

export interface AbsencePanelResult {
  edition: EditionSummary;
  phase: FairPhase;
  generatedAt: string;
  totals: { present: number; missing: number; total: number };
  data: AlertGroup[];
}

export interface FairScheduleResult {
  edition: EditionSummary;
  configured: boolean;
  schedule: FairSchedule;
}

export class AbsenceAlertError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AbsenceAlertError";
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

async function request<T>(path: string, fallback: string): Promise<T> {
  const response = await apiFetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) {
    if (response.status === 404) throw new AbsenceAlertError("No hay una edición activa.", 404);
    throw new AbsenceAlertError(await readError(response, fallback), response.status);
  }
  return response.json();
}
export function fetchAbsenceAlert(): Promise<AbsenceAlertResult> {
  return request("/absence-alert", "No se pudo cargar la alerta de inasistencia.");
}

export function fetchAbsencePanel(attendance?: JurorAttendanceState): Promise<AbsencePanelResult> {
  const query = attendance ? `?attendance=${attendance}` : "";
  return request(`/absence-alert/panel${query}`, "No se pudo cargar el panel de seguimiento.");
}

export function fetchFairSchedule(): Promise<FairScheduleResult> {
  return request("/absence-alert/schedule", "No se pudo cargar el cronograma.");
}

export async function updateFairSchedule(schedule: FairSchedule & { editionId?: number }): Promise<FairScheduleResult> {
  const response = await apiFetch(`${API_URL}/absence-alert/schedule`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  if (!response.ok) {
    throw new AbsenceAlertError(
      await readError(response, "No se pudo guardar el cronograma."),
      response.status,
    );
  }
  return response.json();
}
