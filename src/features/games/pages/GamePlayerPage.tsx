import NavBar from "@/components/NavBar";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGameLoader } from "@/features/games/hooks/useGameLoader";
import { GamePlayerStatus } from "@/features/games/components/GamePlayerStatus";
import { entryUrl, type GameKind } from "@/features/games/lib/gameFiles";
import { useTouchOnly } from "@/hooks/useTouchOnly";
import { parseRouteId } from "@/lib/routeId";
import { isMobileFriendly } from "@/features/games/lib/mobileFriendly";

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
  // En el celular no se descarga el zip: los juegos se juegan solo en computador (HU-40), salvo las excepciones de ARK-317
  const touchOnly = useTouchOnly() && !isMobileFriendly(kind, id);
  const state = useGameLoader(kind, id, !touchOnly);
  const title = state.status === "ready" && state.name ? `${state.name}, de ${state.teamName}` : "Videojuego";

  const content =
    state.status === "ready" && !touchOnly ? (
      <iframe
        src={entryUrl(state.key, state.entry)}
        className={embedded ? "gameFrame gameFrame--embed" : "gameFrame"}
        allow={IFRAME_ALLOW}
        allowFullScreen
        title={title}
      />
    ) : (
      <GamePlayerStatus
        touchOnly={touchOnly}
        state={state}
        embedded={embedded}
        onBack={() => (window.history.length > 1 ? navigate(-1) : navigate("/equipos"))}
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
