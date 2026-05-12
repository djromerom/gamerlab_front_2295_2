import NavBar from "@/components/grupo 5/NavBar";
import useGameFrameID from "../../hooks/useGameFrameID"

export default function GamePlayerPage() {

  // gameRef es el link por el cual se accede al index.html del juego correspondiente.
  // el useGameFrameID hook lo que hace es buscar ese link dado el id del juego.
  // TODO: El id del juego sacalo de un parametro de URL or something
  const gameUrl = useGameFrameID("/games/pygbag/index.html");

    return(

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
                  src={gameUrl}
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