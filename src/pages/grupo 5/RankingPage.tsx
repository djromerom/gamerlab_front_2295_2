"use client";

import NavBar from "@/components/grupo 5/NavBar";
import { useState, useEffect } from "react";

type Team = {
  id: number;
  name: string;
  score: number;
  color: string;
};

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

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
`;

export default function PodioGamer() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/reports/videojuegoData");
        const data = await res.json();

        const formattedTeams = data.map((team: any) => ({
          id: team.id,
          name: team.nombre,
          score: team.promedio,
          color: getRandomColor(),
        }));

        setTeams(formattedTeams);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    fetchData();
  }, []);

  const [teamId, setTeamId] = useState<string>("1");
  const [newScore, setNewScore] = useState<string>("");

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const updateScore = () => {
    if (!newScore) return;

    const id = Number.parseInt(teamId);
    const score = Number.parseInt(newScore);

    if (isNaN(id) || isNaN(score)) return;

    setTeams(teams.map((team) => (team.id === id ? { ...team, score } : team)));

    setNewScore("");
  };

  // Inyectar los estilos CSS en el documento
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
            Ranking en vivo
          </h1>

          <div className="flex w-full max-w-4xl items-end justify-center space-x-8">
            {/* Segundo lugar */}
            {sortedTeams[1] && (
              <div className="flex w-full flex-col items-center">
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-full border-4 border-[#c0c0c0]">
                    <div
                      className={`absolute inset-0 ${sortedTeams[1].color} flex items-center justify-center`}
                    >
                      <span className="text-2xl font-bold text-white">
                        {sortedTeams[1].name.substring(0, 1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-lg font-semibold">
                    {sortedTeams[1].name}
                  </p>
                  <p className="text-center text-xl font-bold text-[#c0c0c0]">
                    {sortedTeams[1].score}
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
                  <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-full border-4 border-[#AC7CFF]">
                    <div
                      className={`absolute inset-0 ${sortedTeams[0].color} flex items-center justify-center`}
                    >
                      <span className="text-3xl font-bold text-white">
                        {sortedTeams[0].name.substring(0, 1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-xl font-semibold">
                    {sortedTeams[0].name}
                  </p>
                  <p className="text-center text-2xl font-bold text-[#AC7CFF]">
                    {sortedTeams[0].score}
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
                  <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-[#c0c0c0]">
                    <div
                      className={`absolute inset-0 ${sortedTeams[2].color} flex items-center justify-center`}
                    >
                      <span className="text-xl font-bold text-white">
                        {sortedTeams[2].name.substring(0, 1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-base font-semibold">
                    {sortedTeams[2].name}
                  </p>
                  <p className="text-center text-lg font-bold text-[#c0c0c0]">
                    {sortedTeams[2].score}
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
                          {/* Imagen del grupo, aquí deben renderizar la imagen (logo) de cada grupo */}
                          <div
                            className={`w-6 h-6 rounded-full mr-3 ${team.color} flex items-center justify-center`}
                          >
                            <span className="text-xs font-bold text-white">
                              {team.name.substring(0, 1)}
                            </span>
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
        </div>
      </div>
    </>
  );
}
