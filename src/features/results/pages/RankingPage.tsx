"use client";


import { apiFetch } from "@/lib/api";
import NavBar from "@/components/NavBar";
import { useState, useEffect } from "react";
import { TextSizeControl } from "@/components/TextSizeControl";
import { DiscordButton } from "@/components/DiscordButton";
import { ArkadBackground } from "@/components/background/ArkadBackground";
import type { PublicRankingTab } from "@/features/results/lib/rankingGroups";
import { PUBLIC_FINAL_GRADE_WEIGHTING_TEXT } from "@/features/results/lib/finalGradeWeights";
import { missingScoreMessage, splitByFinalScore } from "@/features/results/lib/rankingScore";

type Team = {
  id: number;
  name: string;
  /** null: el equipo todavía no tiene nota final (ARK-238); no tiene puesto ni sale como 0.00. */
  finalScore: number | null;
  logo?: string;
  teamCode?: string;
  tieBreakerScore?: number | null;
  position?: number | null;
  levelPosition?: number | null;
  tiePending?: boolean;
};

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
      #FFD700,
      #FFC700,
      #FFB700,
      #FFA700,
      #FFD700
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

// ARK-273: no hay pestaña «Externos» (decisión del 16-nov); cada equipo sale en su nivel.
const TABS: { tab: PublicRankingTab; label: string }[] = [
  { tab: "all", label: "Todos" },
  { tab: "n1", label: "Primer Semestre" },
  { tab: "n2", label: "Segundo Semestre" },
  { tab: "n3", label: "Tercer Semestre" },
  { tab: "n4", label: "Cuarto Semestre" },
  { tab: "n10", label: "Décimo Semestre" },
  { tab: "n0", label: "Colegios" },
];

// Podio de un nivel: 2.º, 1.º y 3.º, en ese orden de izquierda a derecha.
const PODIUM_SPOTS = [
  { place: 2, avatar: "h-20 w-20", ring: "border-[#c0c0c0]", initial: "text-2xl", name: "text-lg", score: "text-xl text-[#c0c0c0]", bar: "h-32 gradient-border-silver", number: "text-6xl" },
  { place: 1, avatar: "h-24 w-24", ring: "border-[#FFD700]", initial: "text-3xl", name: "text-xl", score: "text-2xl text-[#FFD700]", bar: "h-40 gradient-border-gold", number: "text-7xl" },
  { place: 3, avatar: "h-16 w-16", ring: "border-[#CD7F32]", initial: "text-xl", name: "text-base", score: "text-lg text-[#CD7F32]", bar: "h-24 gradient-border-bronze", number: "text-5xl" },
] as const;

const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

export default function RankingPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [fairEnded, setFairEnded] = useState(false);
  const [activeSemester, setActiveSemester] = useState<PublicRankingTab>("all");

  const normalizeNumber = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizeNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const isRankingVisible = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/settings/show-ranking`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Ocurrió un error.");
      }

      const isVisible = await res.json();
      setFairEnded(Boolean(isVisible.showRanking));
    } catch (error) {
      console.error("Error consultando visibilidad del ranking:", error);
      setFairEnded(false);
    }
  };

  const fetchData = async (n: string) => {
    try {
      const res = await apiFetch(
        `${API_BASE_URL}/teams/final-score/by-n/${encodeURIComponent(n)}`,
      );

      if (!res.ok) {
        throw new Error("No se pudo cargar el ranking.");
      }

      const data = await res.json();

      const formattedTeams: Team[] = data.map((team: any) => {
        const finalScore = normalizeNullableNumber(
          team.finalScore ?? team.final_score ?? team.finalscore,
        );

        return {
          id: normalizeNumber(
            team.teamId ?? team.team_id ?? team.id ?? team.videogameId,
          ),
          name:
            team.videogameName ??
            team.videogame_name ??
            team.teamName ??
            team.team_name ??
            "Sin nombre",
          finalScore,
          logo:
            team.logoUrl ??
            team.logo_url ??
            team.videogameLogoUrl ??
            team.videogame_logo_url ??
            undefined,
          teamCode: team.teamCode ?? team.team_code ?? undefined,
          tieBreakerScore: normalizeNullableNumber(
            team.tieBreakerScore ?? team.tie_breaker_score,
          ),
          position: normalizeNullableNumber(
            team.position ?? team.levelPosition ?? team.level_position,
          ),
          levelPosition: normalizeNullableNumber(
            team.levelPosition ?? team.level_position ?? team.position,
          ),
          tiePending: Boolean(team.tiePending ?? team.tie_pending),
        };
      });

      setTeams(formattedTeams);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setTeams([]);
    }
  };

  useEffect(() => {
    isRankingVisible();
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    fetchData("all");

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // ARK-238: el back manda primero a los equipos con nota, ya ordenados. Los que no tienen nota
  // no van al podio ni se numeran: salen al final con «Nota en proceso».
  const { scored, unscored } = splitByFinalScore(teams);
  const podium = activeSemester === "all" ? [] : scored.slice(0, 3);
  const rankedRows = scored.slice(podium.length);

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

      <div className="relative min-h-screen overflow-hidden">
        <ArkadBackground modo="lento" estiloNuevo />

        <div className="relative z-10 flex flex-col items-center p-4 pb-12 pt-30 text-white">
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
            <span className="text-[#AC7CFF]">Feria Gamer Uninorte</span>
            <span className="hidden md:inline"> - </span>
            <span className="block md:inline">Ranking de Videojuegos</span>
          </h1>

          {fairEnded && (
            <p className="-mt-5 mb-6 text-center text-sm text-gray-300">
              {PUBLIC_FINAL_GRADE_WEIGHTING_TEXT}
            </p>
          )}

          {fairEnded && (
            <div className="w-full max-w-6xl mb-8 px-4">
              <div className="flex justify-start md:justify-center gap-2 md:gap-3 flex-nowrap md:flex-wrap overflow-x-auto [scrollbar-width:none] bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-2">
                {TABS.map(({ tab, label }) => (
                  <button
                    key={tab}
                    onClick={async () => {
                      setActiveSemester(tab);
                      await fetchData(tab);
                    }}
                    className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base cursor-pointer rounded-md transition-all ${
                      activeSemester === tab
                        ? "bg-[#AC7CFF] text-[#060312] font-medium"
                        : "text-gray-300 hover:bg-[#1A1428]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!fairEnded ? (
            <div className="w-full max-w-4xl mb-12">
              <div className="relative gradient-border gradient-border-purple p-0">
                <div className="gradient-border-inner"></div>
                <div className="relative z-10 text-center p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#AC7CFF]">
                    El ranking aún no está disponible debido a que la feria no ha
                    finalizado
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Los datos aparecerán una vez finalice el evento
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeSemester !== "all" && (podium.length > 0 ? (
                <div className="flex w-full max-w-4xl items-end justify-center gap-3 sm:gap-8">
                  {PODIUM_SPOTS.map((spot) => {
                    const team = podium[spot.place - 1];
                    // Hueco vacío: el 1.º conserva su ancho aunque falten el 2.º o el 3.º.
                    if (!team) return <div key={spot.place} aria-hidden="true" className="w-full" />;
                    return (
                      <div key={spot.place} data-podium-place={spot.place} className="flex w-full min-w-0 flex-col items-center">
                        <div className="mb-4 flex w-full flex-col items-center">
                          <div className={`relative mb-2 ${spot.avatar} overflow-hidden rounded-full border-4 ${spot.ring} bg-gray-800 flex items-center justify-center`}>
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className={`${spot.initial} font-bold text-white`}>{team.name.substring(0, 1)}</span>
                            )}
                          </div>
                          <p className={`w-full text-center ${spot.name} font-semibold [overflow-wrap:anywhere]`}>{team.name}</p>
                          <p className={`text-center ${spot.score} font-bold`}>{team.finalScore.toFixed(2)}</p>
                        </div>

                        <div className={`${spot.bar} w-full rounded-t-lg shadow-lg relative gradient-border`}>
                          <div className="gradient-border-inner"></div>
                          <div className="flex h-full items-center justify-center relative z-10">
                            <span className={`${spot.number} font-bold text-white`}>{spot.place}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-300">Aún no hay equipos con nota en este nivel.</p>
              ))}

              <div className="mt-8 w-full max-w-4xl">
                <h2 className="mb-4 text-2xl font-bold text-center text-purple-400">
                  {activeSemester === "all"
                    ? "Ranking General"
                    : "Otras Posiciones"}
                </h2>

                <div className="w-16 h-1 bg-purple-500 mx-auto mb-4 rounded-full"></div>

                <div className="bg-[#060312] border-1 border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#110D20]">
                      <tr>
                        <th className="w-px whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-gray-200 sm:px-4">
                          Posición
                        </th>
                        <th className="px-2 py-3 text-left text-sm font-medium text-gray-200 sm:px-4">
                          Equipo
                        </th>
                        <th className="w-px whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-gray-200 sm:px-4">
                          Calificación
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {[...rankedRows, ...unscored].map((team, index) => {
                        const ranked = index < rankedRows.length;
                        return (
                          <tr
                            key={`${team.id}-${team.teamCode ?? team.name}`}
                            className="border-t border-gray-700"
                          >
                            <td className="px-2 py-3 text-sm text-gray-300 sm:px-4">
                              {ranked ? (
                                podium.length + index + 1
                              ) : (
                                <span aria-label="Sin puesto" title="Sin puesto">—</span>
                              )}
                            </td>

                            <td className="px-2 py-3 text-sm sm:px-4">
                              <div className="flex items-center">
                                <div className="w-6 h-6 shrink-0 rounded-full mr-3 overflow-hidden bg-gray-700 flex items-center justify-center">
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

                                <span className="min-w-0 text-gray-200 [overflow-wrap:anywhere]">
                                  {team.name}
                                </span>
                                {team.tiePending && (
                                  <span className="ml-2 rounded-full border border-amber-400/50 px-2 py-0.5 text-xs text-amber-300">
                                    Empate pendiente
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-2 py-3 text-sm text-left font-medium text-gray-300 sm:px-4">
                              {team.finalScore !== null ? (
                                team.finalScore.toFixed(2)
                              ) : (
                                <span className="text-xs font-normal italic text-gray-400 sm:whitespace-nowrap">
                                  {missingScoreMessage()}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {rankedRows.length + unscored.length === 0 && (
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

          <TextSizeControl />
          <DiscordButton discordUrl={discordSupportUrl} />
        </div>
      </div>
    </>
  );
}
