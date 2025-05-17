import React from "react";
import { useNavigate } from "react-router-dom";
import "@/index.css";
import CountdownTimer from "@/components/grupo 5/CountdownTimer";
import NavBar from "@/components/grupo 5/NavBar";

function Landing(): React.ReactElement {
  const targetDate = new Date("2025-06-04T08:30:00");
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="relative h-dvh bg-[#0d0f14] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
          style={{ backgroundImage: "url('/background.webp')" }}
        >
          <div className="absolute inset-0"></div>
        </div>

        <div className="relative z-10 text-white text-center px-4 flex flex-col justify-center items-center min-h-screen">
          <CountdownTimer targetDate={targetDate} />
          <h1 className="font-inter text-4xl sm:text-7xl font-bold">
            Una muestra de videojuegos sin precedentes en Uninorte
          </h1>
          <h2 className="text-2xl md:text-4xl font-medium tracking-tighter mt-4">
            Feria Gamer Uninorte
          </h2>
          <p className="text-lg md:text-xl mt-6 max-w-3xl">
            Bienvenidos a la experiencia definitiva donde la creatividad y la
            tecnología se encuentran. Únete a nosotros para explorar los
            videojuegos más innovadores creados por talentosos desarrolladores.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate("/registro-equipo")}
              className="bg-white text-[#060312] py-3 px-5 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer"
            >
              Registra tu equipo aquí
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
export default Landing;
