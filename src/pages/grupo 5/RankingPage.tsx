"use client";

import NavBar from "@/components/grupo 5/NavBar";
import { useState, useEffect, useContext } from "react";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext";

type Team = {
  id: number;
  name: string;
  score: number;
  logo?: string; // Changed: color property removed, logo is optional string
};

// Estilos para el borde luminoso mejorado
const glowStyles = `
  @property --angle{
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes spin{
    from{
      --angle: 0deg;
    }
    to{
      --angle: 360deg;
    }
  }

  .gradient-border {
    position: relative;
    z-index: 0;
    border-radius: 8px;
    overflow: hidden;
  }

  .gradient-border::after, .gradient-border::before{
    content: '';
    position: absolute;
    height: 100%;
    width: 100%;
    background-image: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    z-index: -1;
    border-radius: 8px;
    animation: 3s spin linear infinite;
  }
  
  .gradient-border::before{
    filter: blur(1.5rem);
    opacity: 0.5;
  }

  .gradient-border-inner {
    position: absolute;
    inset: 3px;
    background: #060312;
    border-radius: 6px;
    z-index: 1;
  }

  .gradient-border-gold::after, .gradient-border-gold::before {
    background-image: conic-gradient(
  from var(--angle),
  #6A0DAD,
  #8E2DE2,
  #A55EEA,
  #C084FC,
  #3C1361,
  #6A0DAD
);

  }

  .gradient-border-silver::after, .gradient-border-silver::before {
    background-image: conic-gradient(from var(--angle), #c0c0c0, #e8e8e8, #a9a9a9, #d3d3d3, #f5f5f5, #c0c0c0);
  }

  .gradient-border-bronze::after, .gradient-border-bronze::before {
    background-image: conic-gradient(from var(--angle), #cd7f32, #b87333, #a57164, #b87333, #cd7f32);
  }

    .gradient-border-purple::after, .gradient-border-purple::before {
    background-image: conic-gradient(
      from var(--angle),
      #6A0DAD,
      #8E2DE2,
      #A55EEA,
      #C084FC,
      #3C1361,
      #6A0DAD
    );
  }
`;

const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
const API_ENDPOINT = `${API_BASE_URL}/reports`;
// const FAIR_ENDED = import.meta.env.VITE_FAIR_ENDED || false;
const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

export default function PodioGamer() {
  const [teams, setTeams] = useState<Team[]>([]);
  // const [fairEnded, setFairEnded] = useState(false);
  const { canViewScores } = useGlobalState()
  

  // console.log("fairEnded:", fairEnded);
  // console.log("canViewScores from global state:", canViewScores);

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_ENDPOINT}/videojuegoData`);
        const data = await res.json();

        const formattedTeams = data.map((team: any) => ({
          id: team.id,
          name: team.nombre,
          score: team.promedio,
          logo: team.logoUrl, // Use logoUrl for the logo
        }));

        setTeams(formattedTeams);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();
  }, []);

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = glowStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);


  return (
    <>
      <NavBar />

      <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
          style={{ backgroundImage: "url('/background.webp')" }}
        >
          <div className="absolute inset-0"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center p-4 pb-12 pt-30 text-white">
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Feria Gamer Uninorte</span> -
            Ranking de videojuegos

          </h1>
          {!canViewScores ? (
            <div className="w-full max-w-4xl mb-12">
              <div className="relative gradient-border gradient-border-purple p-0">
                <div className="gradient-border-inner"></div>
                <div className="relative z-10 text-center p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                    El ranking aún no está disponible debido a que la feria no ha finalizado
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Los datos aparecerán una vez finalice el evento
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full max-w-4xl items-end justify-center space-x-8">
                {/* Segundo lugar */}
                {sortedTeams[1] && (
                  <div className="flex w-full flex-col items-center">
                    <div className="mb-4 flex flex-col items-center">
                      <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-full border-4 border-[#c0c0c0] bg-gray-800 flex items-center justify-center">
                        {sortedTeams[1].logo ? (
                          <img
                            src={sortedTeams[1].logo}
                            alt={sortedTeams[1].name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {sortedTeams[1].name.substring(0, 1)}
                          </span>
                        )}
                      </div>
                      <p className="text-center text-lg font-semibold">
                        {sortedTeams[1].name}
                      </p>
                      <p className="text-center text-xl font-bold text-[#c0c0c0]">
                        {sortedTeams[1].score.toFixed(3)}
                      </p>
                    </div>
                    <div className="h-32 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-silver">
                      <div className="gradient-border-inner"></div>
                      <div className="flex h-full items-center justify-center relative z-10">
                        <span className="text-6xl font-bold text-white">2</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primer lugar */}
                {sortedTeams[0] && (
                  <div className="flex w-full flex-col items-center">
                    <div className="mb-4 flex flex-col items-center">
                      <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-full border-4 border-[#AC7CFF] bg-gray-800 flex items-center justify-center">
                        {sortedTeams[0].logo ? (
                          <img
                            src={sortedTeams[0].logo}
                            alt={sortedTeams[0].name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {sortedTeams[0].name.substring(0, 1)}
                          </span>
                        )}
                      </div>
                      <p className="text-center text-xl font-semibold">
                        {sortedTeams[0].name}
                      </p>
                      <p className="text-center text-2xl font-bold text-[#AC7CFF]">
                        {sortedTeams[0].score.toFixed(3)}
                      </p>
                    </div>
                    <div className="h-40 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-gold">
                      <div className="gradient-border-inner"></div>
                      <div className="flex h-full items-center justify-center relative z-10">
                        <span className="text-7xl font-bold text-white">1</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tercer lugar */}
                {sortedTeams[2] && (
                  <div className="flex w-full flex-col items-center">
                    <div className="mb-4 flex flex-col items-center">
                      <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-[#c0c0c0] bg-gray-800 flex items-center justify-center"> 
                        {sortedTeams[2].logo ? (
                          <img
                            src={sortedTeams[2].logo}
                            alt={sortedTeams[2].name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {sortedTeams[2].name.substring(0, 1)}
                          </span>
                        )}
                      </div>
                      <p className="text-center text-base font-semibold">
                        {sortedTeams[2].name}
                      </p>
                      <p className="text-center text-lg font-bold text-[#c0c0c0]">
                        {sortedTeams[2].score.toFixed(3)}
                      </p>
                    </div>
                    <div className="h-24 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-silver">
                      <div className="gradient-border-inner"></div>
                      <div className="flex h-full items-center justify-center relative z-10">
                        <span className="text-5xl font-bold text-white">3</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Lista de equipos en otras posiciones */}
              <div className="mt-8 w-full max-w-4xl">
                <h2 className="mb-4 text-2xl font-bold text-center text-purple-400">
                  Otras Posiciones
                </h2>
                <div className="w-16 h-1 bg-purple-500 mx-auto mb-4 rounded-full"></div>
                <div className="bg-[#060312] border-1 border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#110D20]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">
                          Posición
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">
                          Equipo
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">
                          Calificación
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.slice(3).map((team, index) => (
                        <tr key={team.id} className="border-t border-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {index + 4}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full mr-3 overflow-hidden bg-gray-700 flex items-center justify-center">
                                {team.logo ? (
                                  <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-white">
                                    {team.name.substring(0, 1)}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-200">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-left font-medium text-gray-300">
                            {team.score}
                          </td>
                        </tr>
                      ))}
                      {sortedTeams.slice(3).length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-sm text-center text-gray-400"
                          >
                            No hay más equipos para mostrar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          <TextSizeControls />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  );
}