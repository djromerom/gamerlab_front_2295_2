import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/** HU-47 (ARK-304): todo empate se resuelve por fecha de inscripción; nadie decide. */
export type TieRule = "REGISTRATION";
export type TieStatus = "PENDING" | "RESOLVED";

export interface Person {
  id: string;
  name: string;
}

export interface RankedTeam {
  position: number;
  teamId: number;
  teamCode: string;
  teamName: string | null;
  isExternal: boolean;
  videogameId: number;
  videogameName: string | null;
  logoUrl: string | null;
  finalScore: number;
  avgJunior: number | null;
  avgSenior: number | null;
  juniorEvaluations: number;
  juniorCounted: number;
  juniorNotCounted: number;
  seniorEvaluations: number;
  lessThanMinEvaluations: boolean;
  missingProfessorScore: boolean;
  registrationDate: string;
  podium: boolean;
  tieKey: string | null;
}

export interface TieGroup {
  tieKey: string;
  editionId: number;
  level: number;
  score: number;
  positions: [number, number];
  affectsPodium: boolean;
  rule: TieRule;
  status: TieStatus;
  teams: Array<{
    teamId: number;
    teamCode: string;
    teamName: string | null;
    videogameName: string | null;
    /** Puede faltar: el equipo va después de los que sí la tienen (HU-47) */
    registrationDate: string | null;
  }>;
  /** Orden ya resuelto: primero el inscrito antes; con la misma fecha, el id menor */
  order: number[];
  explanation: string;
}

export interface RankingSnapshot {
  editionId: number;
  podiumSize: number;
  weighting: { configured: boolean; juniorPct: number; seniorPct: number };
  finalized: { at: string; matchesCurrent: boolean } | null;
  /** ARK-272: todo equipo compite en su nivel; ya no hay grupo «Externos». */
  levels: RankingGroup[];
}

/** Un nivel (N0 a N4). */
export interface RankingGroup {
  level: number;
  label: string;
  teams: RankedTeam[];
  podium: RankedTeam[];
  ties: TieGroup[];
  withoutScore: Array<{
    teamId: number;
    teamCode: string;
    teamName: string | null;
    missing?: Array<"PROFESSOR" | "JUROR">;
  }>;
}

/** Podio de un nivel en `GET /ranking/winners`. */
export interface WinnersGroup {
  level: number;
  label: string;
  podium: RankedTeam[];
  ties: TieGroup[];
}

export interface RankingWinners {
  editionId: number;
  podiumSize: number;
  finalized: { at: string; matchesCurrent: boolean } | null;
  levels: WinnersGroup[];
}

export interface FinalizeResult {
  editionId: number;
  teams: number;
  levels: Array<{ level: number; label: string; teams: number }>;
  /** Decisiones nuevas guardadas como historial (0 si se repite el cierre) */
  registeredDecisions?: number;
}

export interface RankingDecision {
  id: number;
  editionId: number;
  level: number;
  score: number;
  tieKey: string;
  teamIds: number[];
  orderedTeamIds: number[];
  method: "PROFESSOR" | "REGISTRATION" | "ADMIN";
  reason: string;
  decidedBy: Person;
  decidedAt: string;
}

async function responseBody(response: Response, fallback: string) {
  if (response.ok) return response.json();
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
    else if (Array.isArray(body?.message)) message = body.message.join(", ");
  } catch {
    // Keep the status-specific fallback.
  }
  throw new Error(message);
}

function rankingUrl(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  return `${API_URL}/ranking${path}${query ? `?${query}` : ""}`;
}

export async function fetchRanking(options: { editionId?: number; level?: number; top?: number } = {}) {
  const params = new URLSearchParams();
  if (options.editionId) params.set("editionId", String(options.editionId));
  if (options.level !== undefined) params.set("level", String(options.level));
  if (options.top) params.set("top", String(options.top));
  const response = await apiFetch(rankingUrl("", params));
  return responseBody(response, `No se pudo cargar el ranking (${response.status})`) as Promise<RankingSnapshot>;
}

export async function fetchWinners(options: { editionId?: number; level?: number; top?: number } = {}) {
  const params = new URLSearchParams();
  if (options.editionId) params.set("editionId", String(options.editionId));
  if (options.level !== undefined) params.set("level", String(options.level));
  if (options.top) params.set("top", String(options.top));
  const response = await apiFetch(rankingUrl("/winners", params));
  return responseBody(response, `No se pudieron cargar los ganadores (${response.status})`) as Promise<RankingWinners>;
}

/** GET /ranking/ties. Sin `status` trae todos (desde HU-47 todos llegan resueltos). */
export async function fetchRankingTies(options: { status?: TieStatus; podiumOnly?: boolean; editionId?: number } = {}) {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.podiumOnly) params.set("podiumOnly", "true");
  if (options.editionId) params.set("editionId", String(options.editionId));
  const response = await apiFetch(rankingUrl("/ties", params));
  return responseBody(response, `No se pudieron cargar los empates (${response.status})`) as Promise<TieGroup[]>;
}

export async function fetchRankingDecisions(editionId?: number) {
  const params = new URLSearchParams();
  if (editionId) params.set("editionId", String(editionId));
  const response = await apiFetch(rankingUrl("/decisions", params));
  return responseBody(response, `No se pudieron cargar las decisiones (${response.status})`) as Promise<RankingDecision[]>;
}

export async function finalizeRanking(editionId?: number) {
  const params = new URLSearchParams();
  if (editionId) params.set("editionId", String(editionId));
  const response = await apiFetch(rankingUrl("/finalize", params), { method: "POST" });
  return responseBody(response, `No se pudo definir el ranking final (${response.status})`) as Promise<FinalizeResult>;
}
