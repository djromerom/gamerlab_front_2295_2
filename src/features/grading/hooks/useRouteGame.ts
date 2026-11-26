import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";

/** Juego que recibe la pantalla de calificación individual (/pendientes-calificar/:id). */
export interface RouteGame {
  id: number;
  nombre: string;
  imagen?: string;
  equipo?: string;
  materia?: string;
  teamId?: number; // HU-19: para verificar el grupo antes de calificar
  teamCode?: string;
  nrc?: string;
  participantes?: string[];
  descripcion?: string;
}

interface PendingVideogame {
  videogameId: number;
  videogameName: string;
  logoUrl: string;
  teamName: string;
  teamId?: number;
  teamCode?: string;
  members: { fullName: string }[];
  nrc: string | null;
  subject: string | null;
  description: string | null;
  isEvaluated: boolean;
}

/** Un jurado tiene pocos grupos: el tope de la paginación del back (100) los trae todos. */
const PENDING_LIMIT = 100;

/** Busca el juego entre los pendientes del jurado. null si no está o ya lo calificó. */
export async function findPendingGame(videogameId: number): Promise<RouteGame | null> {
  const res = await apiFetch(
    `${import.meta.env.VITE_ENDPOINT_BACKEND}/pending-games?page=1&limit=${PENDING_LIMIT}`,
    { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error(`Error ${res.status} consultando los juegos pendientes`);
  const body = (await res.json()) as { data?: PendingVideogame[] };
  const found = body.data?.find((v) => v.videogameId === videogameId && !v.isEvaluated);
  if (!found) return null;
  return {
    id: found.videogameId,
    nombre: found.videogameName,
    imagen: found.logoUrl,
    equipo: found.teamName,
    teamId: found.teamId,
    teamCode: found.teamCode,
    materia: found.subject || "Sin materia",
    nrc: found.nrc || "Sin NRC",
    participantes: found.members.map((member) => member.fullName),
    descripcion: found.description || "Sin descripción",
  };
}

/**
 * Juego de la pantalla de calificación. Si se llegó desde la tarjeta viene en el `state`; si se
 * llegó por enlace (vuelta del tour 360, recargar la página) se busca con el `:id` de la URL.
 * `notFound` es true cuando el id no es un juego pendiente del jurado.
 */
export function useRouteGame(): { game: RouteGame | undefined; notFound: boolean } {
  const location = useLocation();
  const { id } = useParams();
  const fromState = location.state?.game as RouteGame | undefined;
  const hasState = fromState !== undefined;
  const [fetched, setFetched] = useState<RouteGame | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (hasState) return;
    const videogameId = Number(id);
    if (!Number.isInteger(videogameId) || videogameId <= 0) {
      setNotFound(true);
      return;
    }
    let cancelled = false;
    findPendingGame(videogameId)
      .then((game) => {
        if (cancelled) return;
        if (game) setFetched(game);
        else setNotFound(true);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasState, id]);

  return { game: fromState ?? fetched, notFound: !hasState && notFound };
}
