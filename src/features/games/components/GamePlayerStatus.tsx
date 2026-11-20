import { AlertTriangle, Loader2, Monitor } from "lucide-react";
import type { GameLoaderState } from "@/features/games/hooks/useGameLoader";

interface GamePlayerStatusProps {
  /** Celular o tableta: en vez de cargar el juego se avisa que se juega en computador */
  touchOnly: boolean;
  state: GameLoaderState;
  /** Dentro de la cabina de la landing no hay botón para volver (la cabina tiene el suyo) */
  embedded?: boolean;
  onBack?: () => void;
}

const PHASE_TEXT = {
  file: "Buscando el juego…",
  download: "Descargando el juego…",
  unzip: "Abriendo el juego…",
} as const;

/** Lo que muestra /play-game mientras el juego no está listo: aviso de celular, progreso o error (HU-40, F4). */
export function GamePlayerStatus({ touchOnly, state, embedded = false, onBack }: GamePlayerStatusProps) {
  const back = !embedded && onBack && (
    <button type="button" className="gameStatus__button" onClick={onBack}>
      Volver
    </button>
  );

  if (touchOnly) {
    return (
      <div className="gameStatus" role="status">
        <Monitor className="gameStatus__icon" aria-hidden="true" />
        <h1 className="gameStatus__title">Este juego se juega en computador</h1>
        <p className="gameStatus__text">
          Los juegos de los equipos necesitan teclado y mouse. Ábrelo en Chrome, Edge o Firefox desde un computador.
        </p>
        {back}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="gameStatus" role="alert">
        <AlertTriangle className="gameStatus__icon gameStatus__icon--error" aria-hidden="true" />
        <h1 className="gameStatus__title">No se pudo abrir el juego</h1>
        <p className="gameStatus__text">{state.message}</p>
        <div className="gameStatus__actions">
          {state.reason !== "noFile" && state.reason !== "notFound" && (
            <button type="button" className="gameStatus__button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          )}
          {back}
        </div>
      </div>
    );
  }

  const phase = state.status === "loading" ? state.phase : "file";
  const progress = state.status === "loading" ? state.progress : null;
  return (
    <div className="gameStatus" role="status" aria-live="polite">
      <Loader2 className="gameStatus__icon gameStatus__icon--spin" aria-hidden="true" />
      <p className="gameStatus__title">
        {PHASE_TEXT[phase]}
        {progress !== null && ` ${progress} %`}
      </p>
      {phase === "download" && (
        <p className="gameStatus__text">Los juegos pesan hasta 200 MB: puede tardar unos minutos.</p>
      )}
    </div>
  );
}
