import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type FinalGradeStatus = "NOT_RELEASED" | "IN_PROCESS" | "AVAILABLE";

export interface StudentFinalGrade {
  editionId: number;
  team: { id: number; teamName: string; teamCode: string };
  released: boolean;
  status: FinalGradeStatus;
  finalGrade: number | null;
}

export interface IncompleteFinalGradeTeam {
  teamId: number;
  teamCode: string;
  teamName: string;
  videogameName: string;
  finalScore: number | null;
  juniorEvaluations: number;
  seniorEvaluations: number;
  inProcess: boolean;
  reasons: Array<"MISSING_PROFESSOR_SCORE" | "MISSING_JUNIOR_SCORE" | "LESS_THAN_MIN_EVALUATIONS">;
}

export interface FinalGradeRelease {
  editionId: number;
  editionTitle: string;
  showFinalGrade: boolean;
  releasedAt: string | null;
  fairDate: string | null;
  releaseTime: string;
  timeZone: string;
  scheduleConfigured: boolean;
  releaseAllowedFrom: string;
  canReleaseNow: boolean;
  summary: {
    totalTeams: number;
    withFinalGrade: number;
    inProcess: number;
    lessThanMinEvaluations: number;
  };
  incompleteTeams: IncompleteFinalGradeTeam[];
}

export class FinalGradeApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly releaseAllowedFrom?: string) {
    super(message);
    this.name = "FinalGradeApiError";
  }
}

async function readApiError(response: Response, fallback: string) {
  let body: { message?: string | string[]; code?: string; releaseAllowedFrom?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    return new FinalGradeApiError(fallback, response.status);
  }
  const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
  return new FinalGradeApiError(message || fallback, response.status, body?.code, body?.releaseAllowedFrom);
}

export async function fetchStudentFinalGrade(): Promise<StudentFinalGrade> {
  const response = await apiFetch(`${API_URL}/final-grade/me`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw await readApiError(response, "No se pudo cargar la nota final.");
  return response.json();
}

export async function fetchFinalGradeRelease(): Promise<FinalGradeRelease> {
  const response = await apiFetch(`${API_URL}/final-grade/release`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw await readApiError(response, "No se pudo cargar la publicación de notas.");
  return response.json();
}

export async function setFinalGradeRelease(show: boolean): Promise<FinalGradeRelease> {
  const response = await apiFetch(`${API_URL}/final-grade/release`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ show }),
  });
  if (!response.ok) throw await readApiError(response, "No se pudo actualizar la publicación de notas.");
  return response.json();
}
