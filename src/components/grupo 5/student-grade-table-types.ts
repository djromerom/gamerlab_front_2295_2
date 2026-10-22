export interface GradeTeam {
  teamCode: string;
  nrc: string;
  teamName: string;
  integrantes: string[] | string;
  videogame: string;
  calificacionFeria: number | null;
  calificacionDocente: number | null;
  videogameId: string | number | null;
}

export type GradeFilterType = "student" | "team";

export function gradeKey(team: GradeTeam) {
  return String(team.videogameId ?? team.teamCode);
}

export function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}
