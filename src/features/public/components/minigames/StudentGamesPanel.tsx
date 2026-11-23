import "@/features/public/components/minigames/StudentGamesPanel.css";
import { useEffect, useState } from "react";
import { fetchHighlightedGames, type StudentHighlightedGame } from "@/features/public/api/highlightedGames";
import { editionLabel, editionsOf, playerUrl, webPlay } from "@/features/public/lib/highlightedGames";
import { useTouchOnly } from "@/hooks/useTouchOnly";
import { isMobileFriendly } from "@/features/games/lib/mobileFriendly";

type Estado = "cargando" | "listo" | "error";

interface StudentGamesPanelProps {
  /** La pestaña está a la vista: los destacados se piden la primera vez que se abre */
  active: boolean;
}

/**
 * Pestaña «De los estudiantes» de la sección de juegos de la landing (ARK-233): los juegos que destaca el admin, de una o
 * varias ediciones (HU-41, GET /highlighted-games), con un filtro por edición. En el computador, el juego se abre en la
 * misma cabina de los minijuegos con un iframe a /play-game/:id; en el celular solo se avisa que se juega en computador.
 */
export default function StudentGamesPanel({ active }: StudentGamesPanelProps) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [juegos, setJuegos] = useState<StudentHighlightedGame[]>([]);
  const [edicion, setEdicion] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<StudentHighlightedGame | null>(null);
  const [intento, setIntento] = useState(0);
  const [pedido, setPedido] = useState(false);
  const tactil = useTouchOnly();

  // se piden la primera vez que la pestaña se ve (y otra vez con «Reintentar»)
  if (active && !pedido) setPedido(true);
  useEffect(() => {
    if (!pedido) return;
    let vigente = true;
    setEstado("cargando");
    fetchHighlightedGames()
      .then((lista) => {
        if (!vigente) return;
        setJuegos(lista);
        setEstado("listo");
      })
      .catch(() => {
        if (vigente) setEstado("error");
      });
    return () => {
      vigente = false;
    };
  }, [pedido, intento]);

  // al salir de la pestaña, el juego abierto se cierra (deja de sonar y de ocupar la GPU)
  if (!active && abierto) setAbierto(null);

  const ediciones = editionsOf(juegos);
  const visibles = edicion === null ? juegos : juegos.filter((g) => g.edition.id === edicion);

  if (abierto) {
    return (
      <div className="estudiante-abierto">
        <div className="estudiante-barra">
          <button className="contorno volver" type="button" onClick={() => setAbierto(null)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Juegos de los estudiantes
          </button>
          <p className="estudiante-titulo">
            <b>{abierto.name}</b>
            <small>
              {abierto.teamName} · {editionLabel(abierto.edition)}
            </small>
          </p>
        </div>
        <div className="cabina cabina-estudiante">
          <iframe
            title={`${abierto.name}, de ${abierto.teamName}`}
            src={playerUrl(abierto)}
            allow="fullscreen; autoplay; gamepad"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="estudiantes">
      {ediciones.length > 1 && (
        <div className="filtro-ediciones" role="group" aria-label="Filtrar por edición">
          <button type="button" className="filtro" aria-pressed={edicion === null} onClick={() => setEdicion(null)}>
            Todas
          </button>
          {ediciones.map((e) => (
            <button key={e.id} type="button" className="filtro" aria-pressed={edicion === e.id} onClick={() => setEdicion(e.id)}>
              {editionLabel(e)}
            </button>
          ))}
        </div>
      )}

      {estado === "cargando" && <p className="estado-lista" role="status">Cargando los juegos de los estudiantes…</p>}
      {estado === "error" && (
        <div className="estado-lista" role="alert">
          <p>No pudimos cargar los juegos de los estudiantes.</p>
          <button type="button" className="btn btn-vidrio" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      )}
      {estado === "listo" && juegos.length === 0 && (
        <p className="estado-lista">Pronto verás aquí los mejores juegos de los estudiantes de cada feria.</p>
      )}

      {estado === "listo" && visibles.length > 0 && (
        <ul className="tarjetas-estudiantes" aria-label="Juegos destacados de los estudiantes">
          {visibles.map((g) => {
            const jugar = webPlay(g);
            return (
              <li key={g.id} className="tarjeta-estudiante">
                <div className="logo-estudiante" aria-hidden="true">
                  {g.logoUrl ? <img src={g.logoUrl} alt="" loading="lazy" /> : <span>{g.name.charAt(0)}</span>}
                </div>
                <div className="datos-estudiante">
                  <span className="chip-edicion">{editionLabel(g.edition)}</span>
                  <h3>{g.name}</h3>
                  <p>{g.teamName}</p>
                </div>
                {jugar === "playable" && (!tactil || isMobileFriendly(g.play.type, g.play.id)) && (
                  <button type="button" className="btn btn-blanco" onClick={() => setAbierto(g)} aria-label={`Jugar ${g.name}`}>
                    Jugar
                  </button>
                )}
                {jugar === "playable" && tactil && !isMobileFriendly(g.play.type, g.play.id) && <p className="nota-jugar">Este juego se juega en computador</p>}
                {jugar === "noFile" && <p className="nota-jugar">Sin versión para jugar en la web</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
