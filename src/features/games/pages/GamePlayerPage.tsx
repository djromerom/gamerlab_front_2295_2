import NavBar from "@/components/NavBar";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGameLoader } from "@/features/games/hooks/useGameLoader";
import { GamePlayerStatus } from "@/features/games/components/GamePlayerStatus";
import { entryUrl, type GameKind } from "@/features/games/lib/gameFiles";
import { useTouchOnly } from "@/hooks/useTouchOnly";
import { parseRouteId } from "@/lib/routeId";

import "@/features/games/pages/GamePlayerPage.css";
import { ArkadBackground } from "@/components/background/ArkadBackground";

interface GamePlayerPageProps {
  /** /play-game/:videogameID (en vivo) o /play-game/historical/:videogameID (edición archivada, HU-40) */
  kind?: GameKind;
}

/** F7: pantalla completa, audio sin esperar otro clic y control de juego. */
const IFRAME_ALLOW = "fullscreen; autoplay; gamepad";

export default function GamePlayerPage({ kind = "live" }: GamePlayerPageProps) {
  const { videogameID } = useParams<{ videogameID: string }>();
  // ?embed=1: dentro de la cabina de la landing (ARK-233) solo se muestra el juego, sin la barra ni el fondo
  const [params] = useSearchParams();
  const embedded = params.has("embed");
  const navigate = useNavigate();
  // BG-66: «12abc» o «1e3» no son ids; el cargador los toma como «no encontrado» sin llamar a la API
  const id = parseRouteId(videogameID) ?? Number.NaN;
  // En el celular solo se descarga el zip si el admin marcó el juego «Se puede jugar en celular» (HU-40, TA-36)
  const state = useGameLoader(kind, id, useTouchOnly());
  const touchOnly = state.status === "touchOnly";
  const title = state.status === "ready" && state.name ? `${state.name}, de ${state.teamName}` : "Videojuego";

  const onBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/equipos"));

  const content =
    state.status === "ready" && !touchOnly ? (
      <>
        <iframe
          src={entryUrl(state.key, state.entry)}
          className={embedded ? "gameFrame gameFrame--embed" : "gameFrame"}
          allow={IFRAME_ALLOW}
          allowFullScreen
          title={title}
        />
        {/* BG-77: en el celular el juego va a pantalla completa, tapando la barra; este botón (solo visible ahí) permite salir */}
        {!embedded && (
          <button type="button" className="gameExit" onClick={onBack} aria-label="Salir del juego">
            Salir
          </button>
        )}
      </>
    ) : (
      <GamePlayerStatus
        touchOnly={touchOnly}
        state={state}
        embedded={embedded}
        onBack={onBack}
      />
    );

  if (embedded) return <div className="gameEmbed">{content}</div>;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ArkadBackground modo="lento" estiloNuevo />
      <NavBar />
      <div className="gamePage relative z-10 text-white">{content}</div>
    </div>
  );
}
