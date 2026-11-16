import NavBar from "@/components/NavBar";
import { useParams, useSearchParams } from "react-router-dom";
import fetchGameFrameURL from "@/features/games/api/gameFrame"
import { useEffect, useState } from "react";
import { useGameLoader } from "@/features/games/hooks/useGameLoader";

import '@/features/games/pages/GamePlayerPage.css';
import { ArkadBackground } from "@/components/background/ArkadBackground";

export default function GamePlayerPage() {

  // -> /play-game/:videogameID
  const { videogameID } = useParams<{ videogameID: string }>();
  // ?embed=1: dentro de la cabina de la landing (ARK-233) solo se muestra el juego, sin la barra ni el fondo
  const [params] = useSearchParams();
  const embebido = params.has("embed");

  //use custom hook to setup Service Worker
  //el service worker va a descomprimir y tratar los archivos del juego
  const [vURL, setvURL] = useState("");
  const [gEntry, setgEntry] = useState("");

  const { ready, error } = useGameLoader(videogameID, vURL);

  useEffect(() => {

    const load = async () => {
      const { videogameURL, gameEntry } = await fetchGameFrameURL(+videogameID);
      setvURL(videogameURL);
      setgEntry(gameEntry);
    };

    load();

  }, []);

  if (error) return <p>Error loading game: {error}</p>;
  //if (!ready) return <p>Loading...</p>;

  if (embebido) {
    return (
      <div className="gameEmbed">
        {ready ? (
          <iframe src={`/play-game/${videogameID}/${gEntry}`} className="gameFrame gameFrame--embed" allow="fullscreen; autoplay; gamepad" allowFullScreen title="Videojuego" />
        ) : (
          <p>Cargando archivos del juego...</p>
        )}
      </div>
    );
  }


  return (
    <div className="relative min-h-screen overflow-hidden">
      <ArkadBackground modo="lento" estiloNuevo />

      <NavBar />

      {/*TODO: pasar los styles a un .css*/}
      <div
        className="relative z-10 text-white"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "1rem",
        }}
      >
        {ready ? <iframe
          src={`/play-game/${videogameID}/${gEntry}`}
          className="gameFrame"
        /> : <p>Cargando archivos del juego...</p>}
      </div>
    </div>

  )
}