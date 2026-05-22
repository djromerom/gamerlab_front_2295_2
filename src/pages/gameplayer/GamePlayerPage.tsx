import NavBar from "@/components/grupo 5/NavBar";
import { useParams } from "react-router-dom";
import fetchGameFrameURL from "@/fetchs/fetchGameFrameURL"
import { useEffect, useState } from "react";
import { useGameLoader } from "@/hooks/useGameLoader";

import './gameplayerpage.css';

export default function GamePlayerPage() {

  // -> /play-game/:videogameID
  const { videogameID } = useParams<{ videogameID: string }>();

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


  return (
    <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
        style={{ backgroundImage: "url('/background.webp')" }}
      />

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