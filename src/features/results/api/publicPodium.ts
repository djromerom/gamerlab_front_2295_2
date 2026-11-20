import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_ENDPOINT_BACKEND || "http://localhost:3000";

/**
 * Una fila del podio público (`GET /teams/final-score/by-n/all`, back ARK-306): solo los 3 primeros de cada
 * nivel, ya desempatados por inscripción (HU-47), y sin ninguna nota.
 */
export interface PublicPodiumTeam {
  teamId: number;
  teamCode: string;
  teamName: string | null;
  videogameName: string | null;
  logoUrl: string | null;
  videogameLogoUrl: string | null;
  level: number;
  levelPosition: number;
}

type RawRow = Record<string, unknown>;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const toText = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value : null);

/** Nivel del código («N2-ISI-014» → 2), por si la fila no trae `level`. */
function levelFromCode(teamCode: string | null): number | null {
  const match = teamCode?.match(/^N(\d+)-/i);
  return match ? Number(match[1]) : null;
}

function toPodiumTeam(row: RawRow): PublicPodiumTeam | null {
  const teamCode = toText(row.teamCode ?? row.team_code) ?? "";
  const level = toNumber(row.level) ?? levelFromCode(teamCode);
  const levelPosition = toNumber(row.levelPosition ?? row.level_position ?? row.position);
  const teamId = toNumber(row.teamId ?? row.team_id ?? row.id);
  if (level === null || levelPosition === null || teamId === null) return null;
  return {
    teamId,
    teamCode,
    teamName: toText(row.teamName ?? row.team_name),
    videogameName: toText(row.videogameName ?? row.videogame_name),
    logoUrl: toText(row.logoUrl ?? row.logo_url),
    videogameLogoUrl: toText(row.videogameLogoUrl ?? row.videogame_logo_url),
    level,
    levelPosition,
  };
}

/** Podio público de todos los niveles. */
export async function fetchPublicPodium(): Promise<PublicPodiumTeam[]> {
  const res = await apiFetch(`${API_URL}/teams/final-score/by-n/all`);
  if (!res.ok) throw new Error(`No se pudo cargar el ranking (error ${res.status}).`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((row) => toPodiumTeam(row as RawRow)).filter((team): team is PublicPodiumTeam => team !== null);
}

/** «Ranking público» de Configuración del evento (`GET /settings/show-ranking`). */
export async function fetchPublicRankingVisible(): Promise<boolean> {
  const res = await apiFetch(`${API_URL}/settings/show-ranking`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`No se pudo consultar si el ranking está publicado (error ${res.status}).`);
  const body = await res.json();
  return typeof body === "boolean" ? body : body?.showRanking === true;
}
