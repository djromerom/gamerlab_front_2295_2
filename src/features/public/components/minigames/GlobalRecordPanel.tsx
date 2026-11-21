import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  MinigameRecordError,
  fetchMinigameTop,
  saveMinigameRecord,
  type MinigameRecordRow,
} from "@/features/public/api/minigameRecords";
import {
  ALIAS_INVALID_MESSAGE,
  ALIAS_MAX_LENGTH,
  ALIAS_OFFENSIVE_MESSAGE,
  ALIAS_PERSONAL_DATA_MESSAGE,
  MINIGAME_FINISHED_EVENT,
  aliasProblem,
  announceMinigameRecordSaved,
  formatScore,
  normalizeAlias,
  qualifiesForTop,
  type MinigameFinish,
  type MinigameGame,
} from "@/features/public/lib/minigameRecords";

type Estado =
  | { fase: "oculto" }
  | { fase: "cargando"; fin: MinigameFinish }
  | { fase: "listo" | "guardando"; fin: MinigameFinish; top: MinigameRecordRow[] }
  | { fase: "guardado"; fin: MinigameFinish; top: MinigameRecordRow[]; position: number }
  | { fase: "superado"; fin: MinigameFinish; top: MinigameRecordRow[] }
  | { fase: "sin-guardar"; fin: MinigameFinish };

const MENSAJES_ALIAS: Record<string, string> = {
  MINIGAME_ALIAS_INVALID: ALIAS_INVALID_MESSAGE,
  MINIGAME_ALIAS_PERSONAL_DATA: ALIAS_PERSONAL_DATA_MESSAGE,
  MINIGAME_ALIAS_OFFENSIVE: ALIAS_OFFENSIVE_MESSAGE,
};

/** Mensaje junto al campo para un 400 del alias; en una grosería, el que manda el back (el contrato lo pide así) */
function mensajeAlias(err: MinigameRecordError): string | null {
  if (!err.code || !MENSAJES_ALIAS[err.code]) return null;
  if (err.code === "MINIGAME_ALIAS_OFFENSIVE" && err.serverMessage) return err.serverMessage;
  return MENSAJES_ALIAS[err.code];
}

interface GlobalRecordPanelProps {
  game: MinigameGame;
}

/**
 * Récord global en la tarjeta de fin de partida (HU-52, ARK-316). Al terminar una partida, el juego avisa con
 * announceMinigameFinished; el panel pide el top 5 y muestra el récord global (top[0]) junto al mejor personal.
 * Si el puntaje entra al top, ofrece guardar un alias y luego muestra el puesto y el top.
 * Si el back no responde, da 429 o cualquier error, no se muestra nada: el juego sigue con el récord local.
 */
export default function GlobalRecordPanel({ game }: GlobalRecordPanelProps) {
  const [estado, setEstado] = useState<Estado>({ fase: "oculto" });
  const [alias, setAlias] = useState(""); // se conserva entre partidas de la misma visita (no se guarda en el equipo)
  const [error, setError] = useState<string | null>(null);
  const pedido = useRef(0); // una partida nueva descarta las respuestas de la anterior
  const estadoRef = useRef<HTMLParagraphElement>(null);
  const id = useId();

  useEffect(() => {
    function alTerminar(e: Event) {
      const fin = (e as CustomEvent<MinigameFinish>).detail;
      if (fin?.game !== game) return;
      const n = ++pedido.current;
      setError(null);
      setEstado({ fase: "cargando", fin });
      fetchMinigameTop(game, fin.track)
        .then(({ top }) => {
          if (n === pedido.current) setEstado({ fase: "listo", fin, top });
        })
        .catch(() => {
          if (n === pedido.current) setEstado({ fase: "oculto" });
        });
    }
    window.addEventListener(MINIGAME_FINISHED_EVENT, alTerminar);
    return () => window.removeEventListener(MINIGAME_FINISHED_EVENT, alTerminar);
  }, [game]);

  // el formulario desaparece al guardar: el foco pasa al resultado (así no se pierde y el lector de pantalla lo lee)
  const conResultado = estado.fase === "guardado" || estado.fase === "superado";
  useEffect(() => {
    if (conResultado) estadoRef.current?.focus({ preventScroll: true });
  }, [conResultado]);

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado.fase !== "listo") return;
    const problema = aliasProblem(alias);
    if (problema) {
      setError(problema);
      return;
    }
    const { fin, top } = estado;
    const n = pedido.current;
    setError(null);
    setEstado({ fase: "guardando", fin, top });
    try {
      const r = await saveMinigameRecord({ game, track: fin.track, alias: normalizeAlias(alias), score: fin.score });
      if (n !== pedido.current) return;
      if (r.saved && r.position) {
        setEstado({ fase: "guardado", fin, top: r.top, position: r.position });
        announceMinigameRecordSaved(game);
      } else setEstado({ fase: "superado", fin, top: r.top });
    } catch (err) {
      if (n !== pedido.current) return;
      const mensaje = err instanceof MinigameRecordError ? mensajeAlias(err) : null;
      if (mensaje) {
        setError(mensaje);
        setEstado({ fase: "listo", fin, top });
      } else if (err instanceof MinigameRecordError && err.status === 400) {
        setEstado({ fase: "oculto" }); // puntaje imposible o canción que no existe: no va al top
      } else setEstado({ fase: "sin-guardar", fin }); // 429, sin red o error del servidor
    }
  }

  if (estado.fase === "oculto") return <div className="record-global" hidden />;
  const { fin } = estado;
  const mejor = fin.best === undefined ? null : (
    <div className="record-global-fila">
      <small>TU MEJOR</small>
      <b>{formatScore(Math.max(fin.best, fin.score))}</b>
    </div>
  );

  if (estado.fase === "cargando" || estado.fase === "sin-guardar") {
    return (
      <div className="record-global">
        {mejor}
        <p className="record-global-nota" role="status">
          {estado.fase === "cargando"
            ? "Buscando el récord global…"
            : "No se pudo guardar en el top global ahora. Tu récord en este equipo sigue guardado."}
        </p>
      </div>
    );
  }

  const { top } = estado;
  const primero = top[0];
  const resultado = conResultado;
  const entra = (estado.fase === "listo" || estado.fase === "guardando") && qualifiesForTop(game, top, fin.score);
  const ayudaId = `${id}-ayuda`;

  return (
    <div className="record-global">
      {mejor}
      {!resultado && (
        <div className="record-global-fila">
          <small>RÉCORD GLOBAL</small>
          {primero ? (
            <b>
              {formatScore(primero.score)} <span className="record-global-alias">{primero.alias}</span>
            </b>
          ) : (
            <span className="record-global-vacio">¡Sé el primero!</span>
          )}
        </div>
      )}
      {entra && (
        <form className="record-global-form" onSubmit={guardar} noValidate>
          <label htmlFor={`${id}-alias`}>¡Entras al top 5! Escribe tu alias</label>
          <div className="record-global-campo">
            <input
              id={`${id}-alias`}
              name="alias"
              type="text"
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value);
                if (error) setError(null);
              }}
              maxLength={ALIAS_MAX_LENGTH}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="De 3 a 12 letras"
              aria-invalid={error ? true : undefined}
              aria-describedby={ayudaId}
              disabled={estado.fase === "guardando"}
            />
            <button type="submit" className="record-global-guardar" disabled={estado.fase === "guardando"}>
              {estado.fase === "guardando" ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {/* la regla va en el placeholder; la línea visible es solo para el error (así la tarjeta cabe en el celular) */}
          {error ? (
            <p id={ayudaId} className="record-global-error" role="alert">
              {error}
            </p>
          ) : (
            <span id={ayudaId} className="sr">
              De 3 a 12 letras o números. Se verá en la página principal.
            </span>
          )}
        </form>
      )}
      {resultado && (
        <>
          <p className="record-global-logro" tabIndex={-1} ref={estadoRef}>
            {estado.fase === "guardado"
              ? `¡Quedaste en el puesto ${estado.position} del top global!`
              : "Alguien superó ese puntaje antes que tú. Este es el top global:"}
          </p>
          <ol className="record-global-top" aria-label="Top 5 global">
            {top.map((fila) => (
              <li key={`${fila.position}-${fila.alias}`} aria-current={estado.fase === "guardado" && fila.position === estado.position ? "true" : undefined}>
                <span className="puesto">{fila.position}</span>
                <span className="alias">{fila.alias}</span>
                <b>{formatScore(fila.score)}</b>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
