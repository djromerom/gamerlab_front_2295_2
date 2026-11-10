import { apiFetch } from "@/lib/api";
import type { SurveyFieldKey, SurveyPayload } from "@/lib/jurorSurvey";
import { fileNameFromDisposition, saveBlobAsFile } from "@/fetchs/jurorsExport";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

// ─── Tipos (contrato de ARK-183) ────────────────────────────────────────────

export type SurveyUnavailableReason =
  | "PENDING_EVALUATIONS"
  | "NO_ASSIGNED_TEAMS"
  | "NOT_EDITION_JUROR"
  | "ALREADY_ANSWERED"
  | "NO_ACTIVE_EDITION";

export interface JurorSurveyStatus {
  editionId: number | null;
  available: boolean;
  reason: SurveyUnavailableReason | null;
  answered: boolean;
  answeredAt: string | null;
  assigned: number;
  evaluated: number;
}

/** Resultado de responder: `saved` (201) o `alreadyAnswered` (409, ya quedó guardada). */
export interface JurorSurveyAnswerResult {
  outcome: "saved" | "alreadyAnswered";
  message: string;
}

export interface JurorSurveyFieldSummary {
  key: SurveyFieldKey;
  label: string;
  average: number | null;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface JurorSurveyComment {
  jurorName: string;
  email: string;
  role: string;
  comments: string;
  createdAt: string;
}

export interface JurorSurveySummary {
  edition: { id: number; title: string; year: number; semester: number };
  totals: { responses: number; jurorsFinished: number; editionJurors: number };
  fields: JurorSurveyFieldSummary[];
  comments: JurorSurveyComment[];
}

export class JurorSurveyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly reason?: SurveyUnavailableReason,
  ) {
    super(message);
    this.name = "JurorSurveyApiError";
  }
}

export const SURVEY_THANKS_FALLBACK = "¡Gracias por contarnos tu experiencia!";
const ALREADY_ANSWERED_FALLBACK = "Ya respondiste la encuesta de esta edición. ¡Gracias!";
const NETWORK_ERROR =
  "No pudimos enviar la encuesta. Revisa tu conexión e inténtalo de nuevo; tus respuestas siguen aquí.";

// ─── Helpers ────────────────────────────────────────────────────────────────

type ErrorBody = { message?: string | string[]; code?: string; reason?: SurveyUnavailableReason };

async function readBody(response: Response): Promise<ErrorBody | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readApiError(response: Response, fallback: string): Promise<JurorSurveyApiError> {
  const body = await readBody(response);
  const message = Array.isArray(body?.message) ? body.message.join(". ") : body?.message;
  return new JurorSurveyApiError(message || fallback, response.status, body?.code, body?.reason);
}

const editionQuery = (editionId?: number | null) =>
  editionId ? `?editionId=${encodeURIComponent(editionId)}` : "";

// ─── Jurado y Profesor ──────────────────────────────────────────────────────

/** `GET /juror-survey/status`: ¿mostrar la encuesta al usuario? */
export async function fetchJurorSurveyStatus(): Promise<JurorSurveyStatus> {
  const response = await apiFetch(`${API_URL}/juror-survey/status`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw await readApiError(response, "No se pudo consultar la encuesta.");
  return response.json();
}

/**
 * `POST /juror-survey`. Un 409 cuenta como guardada (doble clic o ya respondida).
 * Lanza `JurorSurveyApiError` con el mensaje del back en 400/403/500,
 * y un mensaje de reintento si falla la red.
 */
export async function submitJurorSurvey(payload: SurveyPayload): Promise<JurorSurveyAnswerResult> {
  let response: Response;
  try {
    response = await apiFetch(`${API_URL}/juror-survey`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const networkError = new JurorSurveyApiError(NETWORK_ERROR, 0);
    (networkError as Error & { cause?: unknown }).cause = error;
    throw networkError;
  }

  if (response.status === 409) {
    const body = await readBody(response);
    const message = typeof body?.message === "string" ? body.message : ALREADY_ANSWERED_FALLBACK;
    return { outcome: "alreadyAnswered", message };
  }

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? "El servidor no pudo guardar la encuesta. Inténtalo de nuevo; tus respuestas siguen aquí."
        : "No se pudo enviar la encuesta.";
    const error = await readApiError(response, fallback);
    if (response.status >= 500) throw new JurorSurveyApiError(fallback, response.status, error.code);
    throw error;
  }

  const body = (await readBody(response)) as { message?: string } | null;
  return { outcome: "saved", message: body?.message || SURVEY_THANKS_FALLBACK };
}

// ─── Administrador ──────────────────────────────────────────────────────────

/** `GET /juror-survey/summary`: sin `editionId` usa la edición activa. */
export async function fetchJurorSurveySummary(editionId?: number | null): Promise<JurorSurveySummary> {
  const response = await apiFetch(`${API_URL}/juror-survey/summary${editionQuery(editionId)}`, {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw await readApiError(response, "No se pudo cargar el resumen de la encuesta.");
  return response.json();
}

export const JUROR_SURVEY_EXPORT_FALLBACK_NAME = "encuesta_jurados.xlsx";

/** `GET /juror-survey/export`: descarga el Excel y devuelve el nombre del archivo. */
export async function downloadJurorSurveyExport(editionId?: number | null): Promise<string> {
  const response = await apiFetch(`${API_URL}/juror-survey/export${editionQuery(editionId)}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) throw await readApiError(response, "No se pudo exportar la encuesta.");

  const fileName =
    fileNameFromDisposition(response.headers.get("content-disposition")) ??
    JUROR_SURVEY_EXPORT_FALLBACK_NAME;
  saveBlobAsFile(await response.blob(), fileName);
  return fileName;
}
