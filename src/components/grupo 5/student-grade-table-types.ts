export interface GradeTeam {
  teamCode: string;
  nrc: string | null;
  teamName: string;
  integrantes: string[] | string;
  videogame: string;
  calificacionFeria: number | null;
  calificacionDocente: number | null;
  videogameId: string | number | null;
  editionId?: string | number | null;
  editionLabel?: string;
  nrcId?: string | number | null;
  canEdit?: boolean;
  source?: "current" | "historical";
}

export type GradeFilterType = "student" | "team";

export function gradeKey(team: GradeTeam) {
  return `${team.editionId ?? "edition"}:${team.teamCode}:${team.videogameId ?? "game"}`;
}

export function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}
