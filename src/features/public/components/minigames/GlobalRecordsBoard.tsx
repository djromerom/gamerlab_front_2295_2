import { useCallback, useEffect, useRef, useState } from "react";
import {
  MinigameRecordError,
  deleteMinigameRecord,
  fetchMinigameTop,
  type MinigameRecordRow,
} from "@/features/public/api/minigameRecords";
import {
  MINIGAME_RECORD_SAVED_EVENT,
  formatScore,
  parseJamTrack,
  type MinigameGame,
} from "@/features/public/lib/minigameRecords";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { SONGS } from "./songs";

const JUEGOS: { game: MinigameGame; nombre: string }[] = [
  { game: "ARKADASH", nombre: "Arkadash" },
  { game: "ARKAD_JAM", nombre: "Arkad Jam" },
];
const INSTRUMENTOS = { guitarra: "Guitarra", piano: "Piano", bateria: "Batería" } as const;
const ERROR_BORRAR = "No se pudo quitar el récord. Revisa tu sesión e inténtalo de nuevo.";

/** Top de cada juego: undefined mientras carga; null si el back falló (ese juego no se muestra) */
type Tops = Partial<Record<MinigameGame, MinigameRecordRow[] | null>>;

/** «Für Elise · Piano» para la pista piano-0 (o «Canción 1» si ya no existe en el repertorio) */
function cancionDe(track: string): string | null {
  const pista = parseJamTrack(track);
  if (!pista) return null;
  return `${SONGS[pista.instrument]?.[pista.index]?.nombre ?? `Canción ${pista.index + 1}`} · ${INSTRUMENTOS[pista.instrument]}`;
}

/**
 * Top 5 global de cada minijuego bajo las portadas (HU-52, ARK-316): Arkadash con game=ARKADASH y Arkad Jam con
 * game=ARKAD_JAM sin canción (cada fila dice la suya). Se pide cuando la sección está cerca y otra vez al guardar un
 * récord. Si el back falla, el juego no muestra su top (los minijuegos siguen igual con el récord local).
 * Con la sesión del Administrador, el back manda el id de cada fila y aquí aparece una «x» para quitar un alias
 * grosero o un puntaje falso (DELETE /minigame-records/:id).
 */
export default function GlobalRecordsBoard() {
  const raiz = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  const cargado = useRef(false);
  const [tops, setTops] = useState<Tops>({});
  const [borrando, setBorrando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { userRole } = useAuth();
  const fetchConSesion = useFetch();
  const esAdmin = userRole === "Administrador";

  const cargar = useCallback((game: MinigameGame) => {
    cargado.current = true;
    return fetchMinigameTop(game)
      .then(({ top }) => vivo.current && setTops((t) => ({ ...t, [game]: top })))
      .catch(() => vivo.current && setTops((t) => ({ ...t, [game]: null })));
  }, []);

  useEffect(() => {
    vivo.current = true;
    // la primera carga, con la sección cerca (como Three.js); sin IntersectionObserver, enseguida
    let observador: IntersectionObserver | undefined;
    const todo = () => JUEGOS.forEach(({ game }) => cargar(game));
    if (typeof IntersectionObserver === "undefined" || !raiz.current) todo();
    else {
      observador = new IntersectionObserver(([e]) => {
        if (!e?.isIntersecting) return;
        observador?.disconnect();
        todo();
      }, { rootMargin: "100% 0px" });
      observador.observe(raiz.current);
    }
    const alGuardar = (e: Event) => {
      const game = (e as CustomEvent<MinigameGame>).detail;
      if (JUEGOS.some((j) => j.game === game)) cargar(game);
    };
    window.addEventListener(MINIGAME_RECORD_SAVED_EVENT, alGuardar);
    return () => {
      vivo.current = false;
      observador?.disconnect();
      window.removeEventListener(MINIGAME_RECORD_SAVED_EVENT, alGuardar);
    };
  }, [cargar]);

  // si la sesión del Administrador se confirma con el top ya cargado (sin id), se pide otra vez para recibir los id
  const eraAdmin = useRef(esAdmin);
  useEffect(() => {
    if (esAdmin && !eraAdmin.current && cargado.current) JUEGOS.forEach(({ game }) => cargar(game));
    eraAdmin.current = esAdmin;
  }, [esAdmin, cargar]);

  async function quitar(game: MinigameGame, fila: MinigameRecordRow) {
    if (fila.id === undefined || borrando !== null) return;
    const seguro = window.confirm(
      `¿Quitar el récord de «${fila.alias}» (${formatScore(fila.score)} puntos) de la pantalla principal? No se puede deshacer.`,
    );
    if (!seguro) return;
    setBorrando(fila.id);
    setAviso(null);
    try {
      await deleteMinigameRecord(fila.id, fetchConSesion);
    } catch (err) {
      // 404: otro Administrador ya lo había borrado; basta con refrescar el top
      if (!(err instanceof MinigameRecordError && err.code === "MINIGAME_RECORD_NOT_FOUND") && vivo.current) setAviso(ERROR_BORRAR);
    }
    // en Arkad Jam la respuesta es el top de la canción y aquí se ve el de todas: se pide de nuevo en los dos juegos
    await cargar(game);
    if (vivo.current) setBorrando(null);
  }

  const visibles = JUEGOS.filter(({ game }) => tops[game] !== null);

  return (
    <div className="records-globales" ref={raiz} hidden={visibles.length === 0}>
      {visibles.map(({ game, nombre }) => {
        const top = tops[game];
        return (
          <section key={game} className="records-juego" aria-label={`Top 5 global de ${nombre}`}>
            <p className="records-titulo">TOP 5 GLOBAL · {nombre.toUpperCase()}</p>
            {top === undefined ? (
              <p className="records-vacio">Cargando…</p>
            ) : top.length === 0 ? (
              <p className="records-vacio">Aún no hay récords: ¡juega y sé el primero!</p>
            ) : (
              <ol className="records-lista">
                {top.map((fila) => {
                  const cancion = game === "ARKAD_JAM" ? cancionDe(fila.track) : null;
                  return (
                    <li key={`${fila.id ?? ""}-${fila.position}-${fila.alias}-${fila.track}`}>
                      <span className="puesto">{fila.position}</span>
                      <span className="quien">
                        <span className="alias">{fila.alias}</span>
                        {cancion && <small>{cancion}</small>}
                      </span>
                      <b>{formatScore(fila.score)}</b>
                      {esAdmin && fila.id !== undefined && (
                        <button
                          type="button"
                          className="records-quitar"
                          aria-label={`Quitar el récord de ${fila.alias}`}
                          title="Quitar de la pantalla principal"
                          disabled={borrando !== null}
                          onClick={() => void quitar(game, fila)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
      {aviso && (
        <p className="records-aviso" role="alert">
          {aviso}
        </p>
      )}
    </div>
  );
}
