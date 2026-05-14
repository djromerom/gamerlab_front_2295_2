import NavBar from "@/components/grupo 5/NavBar";
import { useParams } from "react-router-dom";
import fetchGameFrameURL from "@/fetchs/fetchGameFrameURL"

export default function GamePlayerPage() {

  const { videogameID } = useParams<{ videogameID: string }>();

  // videogameID viene del parámetro de URL /play-game/:videogameID
  // el fetchGameFrameURL lo que hace es buscar el link para sacar el juego de Azure Blob Storage.
  const gameUrl = fetchGameFrameURL(videogameID);

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
        <iframe
          src={"gameUrl"}
          className="gameFrame"
          style={{
            width: "80vw",
            height: "90vh",
            maxWidth: "1600px",
            backgroundColor: "black",
            display: "block",
            margin: "4rem auto 0", // offset, need to avoid the navbar
          }}
        />
      </div>
    </div>

  )
}