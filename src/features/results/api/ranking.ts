import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

export type TieRule = "PROFESSOR" | "REGISTRATION" | "MANUAL";
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
  provisional: boolean;
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
  deciders: Person[];
  teams: Array<{
    teamId: number;
    teamCode: string;
    teamName: string | null;
    videogameName: string | null;
    registrationDate: string;
    professors: Person[];
  }>;
  order: number[];
  decision: {
    id: number;
    method: "PROFESSOR" | "REGISTRATION" | "ADMIN";
    reason: string;
    orderedTeamIds: number[];
    decidedBy: Person;
    decidedAt: string;
  } | null;
  explanation: string;
}

export interface RankingSnapshot {
  editionId: number;
  podiumSize: number;
  weighting: { configured: boolean; juniorPct: number; seniorPct: number };
  pendingTies: number;
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
  pendingTies: number;
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

export async function fetchRankingTies(status: "PENDING" | "RESOLVED" = "PENDING", podiumOnly = false, editionId?: number) {
  const params = new URLSearchParams({ status, podiumOnly: String(podiumOnly) });
  if (editionId) params.set("editionId", String(editionId));
  const response = await apiFetch(rankingUrl("/ties", params));
  return responseBody(response, `No se pudieron cargar los empates (${response.status})`) as Promise<TieGroup[]>;
}

export async function fetchRankingDecisions(editionId?: number) {
  const params = new URLSearchParams();
  if (editionId) params.set("editionId", String(editionId));
  const response = await apiFetch(rankingUrl("/decisions", params));
  return responseBody(response, `No se pudieron cargar las decisiones (${response.status})`) as Promise<RankingDecision[]>;
}

export async function fetchMyTies() {
  const response = await apiFetch(rankingUrl("/my-ties"));
  return responseBody(response, `No se pudieron cargar tus empates (${response.status})`) as Promise<TieGroup[]>;
}

export async function decideTie(payload: {
  tieKey: string;
  orderedTeamIds?: number[];
  useRegistration?: boolean;
  reason?: string;
  editionId?: number;
}) {
  const response = await apiFetch(rankingUrl("/ties/decision"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return responseBody(response, `No se pudo guardar la decisión (${response.status})`);
}

export async function finalizeRanking(editionId?: number) {
  const params = new URLSearchParams();
  if (editionId) params.set("editionId", String(editionId));
  const response = await apiFetch(rankingUrl("/finalize", params), { method: "POST" });
  return responseBody(response, `No se pudo definir el ranking final (${response.status})`) as Promise<FinalizeResult>;
}
