/**
 * ARK-264 (BG-64): «Calificados» (jurado) y «Equipos Evaluados» (profesor) leen
 * `/graded-games`. El back toma el jurado del token (`@GetUser('id')`), así que la URL
 * no lleva `jurorId`.
 */

/** Puntaje de un criterio en la evaluación del jurado (opcional hasta que el back lo envíe). */
export interface GradedCriterion {
  criterionId: number;
  name: string;
  score: number;
}

/** Fila de `/graded-games` y `/graded-games/search`. */
export interface GradedGameApi {
  videogameId: number;
  videogameName: string;
  logoUrl: string;
  teamName: string;
  teamCode?: string;
  members: { fullName: string }[];
  nrc: string | null;
  subject: string | null;
  description: string | null;
  isEvaluated: boolean;
  totalScore: number;
  comments: string;
  criteria?: GradedCriterion[];
}

export function gradedGamesUrl(baseUrl: string, page: number, limit: number): string {
  return `${baseUrl}/graded-games?page=${page}&limit=${limit}`;
}

/** Convierte la fila del back en la tarjeta de `PendingGradesGrid`. */
export function toGradedCard(game: GradedGameApi) {
  return {
    id: game.videogameId,
    nombre: game.videogameName,
    equipo: game.teamName,
    teamCode: game.teamCode,
    materia: game.subject || "Sin materia",
    nrc: game.nrc || "Sin NRC",
    participantes: game.members.map((member) => member.fullName),
    imagen: game.logoUrl,
    descripcion: game.description || "Sin descripción",
    isEvaluated: game.isEvaluated,
    totalScore: game.totalScore,
    comments: game.comments,
    criteria: game.criteria,
  };
}

/** Nota con 2 decimales («4.55», «3.00»); guion si no hay nota. */
export function formatScore(score: number | null | undefined): string {
  return typeof score === "number" && Number.isFinite(score) ? score.toFixed(2) : "—";
}
