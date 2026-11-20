/**
 * HU-42 (ARK-275 back / ARK-276 front): asignar varios equipos a un jurado en una sola
 * operación con `POST /juror/assignments/bulk`. Cada equipo pasa por las reglas de HU-08;
 * los bloqueados quedan sin asignar y no frenan a los demás.
 */
import type { AssignmentWarning } from "@/features/jurors/assignment/lib/assignmentWarnings";
import { type LevelTeam, levelsText, teamLevelLabel } from "./manualAssignment";

/** Igual que `MAX_BULK_TEAMS` del back. */
export const MAX_BULK_TEAMS = 50;

export type BulkTeamStatus = "ASSIGNED" | "ASSIGNED_WITH_WARNINGS" | "BLOCKED";

export interface BulkTeamResult {
  equipoId: number;
  /** null si el equipo no existe o es de otra edición. */
  codigo: string | null;
  nombre: string | null;
  videojuego: string | null;
  estado: BulkTeamStatus;
  /** Advertencias que se aceptaron para este equipo. */
  advertencias: AssignmentWarning[];
  /** Jurados del equipo después de asignar; null si no se asignó. */
  cantidadJurados: number | null;
  bloqueo: { code: string; message: string } | null;
}

export interface BulkAssignResponse {
  message: string;
  edicion: { id: number; title: string };
  jurado: { id: string; nombre: string };
  /** En el mismo orden que `teamIds`. */
  resultados: BulkTeamResult[];
  totales: { solicitados: number; asignados: number; bloqueados: number };
  advertenciasAceptadas: AssignmentWarning[];
}

/** Equipo del 409 que no se asignará aunque se confirmen las advertencias. */
export interface BlockedTeam {
  teamId: number;
  codigo: string | null;
  code: string;
  message: string;
}

/** `blocked` del 409 `ASSIGNMENT_WARNINGS` de la asignación en lote (vacío si no viene). */
export function getBlockedTeams(body: unknown): BlockedTeam[] {
  const blocked = (body as { blocked?: unknown } | null)?.blocked;
  if (!Array.isArray(blocked)) return [];
  return blocked
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item.teamId === "number" && typeof item.message === "string"
    )
    .map((item) => ({
      teamId: item.teamId as number,
      codigo: typeof item.codigo === "string" ? item.codigo : null,
      code: typeof item.code === "string" ? item.code : "",
      message: item.message as string,
    }));
}

/**
 * Nombre a mostrar de un equipo del resultado. El back manda `codigo`/`nombre` en null si el
 * equipo no existe o es de otra edición: se usa el de la lista de casillas.
 */
export function teamDisplayName(
  teamId: number,
  fromBack: { codigo?: string | null; nombre?: string | null },
  teams: LevelTeam[]
): string {
  const local = teams.find((team) => team.id === teamId);
  const code = fromBack.codigo || local?.teamCode || "";
  const name = fromBack.nombre || local?.name || "";
  if (code && name) return `${code} · ${name}`;
  return code || name || `Equipo ${teamId}`;
}

export const STATUS_LABEL: Record<BulkTeamStatus, string> = {
  ASSIGNED: "Asignado",
  ASSIGNED_WITH_WARNINGS: "Asignado con advertencia aceptada",
  BLOCKED: "No se asignó",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status as BulkTeamStatus] ?? status;
}

/** Tono del resumen: todo asignado, parcial o nada asignado. */
export function resultTone(totals: BulkAssignResponse["totales"]): "success" | "partial" | "none" {
  if (totals.asignados === 0) return "none";
  return totals.bloqueados > 0 ? "partial" : "success";
}

/** Marca o desmarca un id; no deja pasar de {@link MAX_BULK_TEAMS}. */
export function toggleTeamId(selected: number[], id: number): number[] {
  if (selected.includes(id)) return selected.filter((current) => current !== id);
  if (selected.length >= MAX_BULK_TEAMS) return selected;
  return [...selected, id];
}

/**
 * «Marcar visibles»: suma los equipos visibles que el jurado aún no tiene, sin pasar
 * de {@link MAX_BULK_TEAMS}.
 */
export function markVisible(selected: number[], visible: LevelTeam[], assignedIds: Set<number>): number[] {
  const next = [...selected];
  for (const team of visible) {
    if (next.length >= MAX_BULK_TEAMS) break;
    if (!assignedIds.has(team.id) && !next.includes(team.id)) next.push(team.id);
  }
  return next;
}

/**
 * Aviso previo de niveles mezclados (el back responderá JUROR_MIXED_LEVELS): equipos
 * marcados de un nivel que el jurado no tiene o, si el jurado aún no tiene equipos,
 * equipos marcados de varios niveles entre sí. Null si no hay mezcla.
 */
export function mixedLevelsNotice(marked: LevelTeam[], levelsOfJuror: number[]): string | null {
  const advice = "Cada jurado debería evaluar grupos de un solo nivel; al asignar se pedirá confirmación.";

  if (levelsOfJuror.length > 0) {
    const others = marked.filter((team) => team.level !== null && !levelsOfJuror.includes(team.level));
    if (others.length === 0) return null;
    const jurorText = levelsText(levelsOfJuror);
    if (others.length === 1) {
      const [team] = others;
      return `«${team.name}» es de ${team.levelLabel} y el jurado ya tiene ${jurorText}. ${advice}`;
    }
    const list = others.map((team) => `«${team.name}» (${team.levelLabel})`).join(", ");
    return `${list} son de otro nivel y el jurado ya tiene ${jurorText}. ${advice}`;
  }

  const levels = [...new Set(marked.map((team) => team.level).filter((level): level is number => level !== null))];
  if (levels.length <= 1) return null;
  const text = levels
    .sort((a, b) => a - b)
    .map(teamLevelLabel)
    .join(", ");
  return `Los equipos marcados son de varios niveles (${text}). ${advice}`;
}
