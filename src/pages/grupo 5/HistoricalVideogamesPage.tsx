import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import NavBar from "@/components/grupo 5/NavBar";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { fetchHistoricalTeamsWithScores, fetchEditionById } from "@/fetchs/editions";
import { TeamCard } from "@/components/videogamePage/TeamCard";
import { GameDetailModal } from "@/components/videogamePage/GameDetailModal";
import { Team } from "@/types/Team";
import { Edition } from "@/fetchs/editions";
import { ChevronLeft, ChevronRight, Trophy, ArrowLeft } from "lucide-react";
import { TeamSkeletonGrid } from "@/components/grupo 5/TeamSkeleton";
import { Filters } from "@/components/videogamePage/Filters";
import { motion } from "framer-motion";
import { FondoArkad } from "@/components/fondo/FondoArkad";

const glowStyles = `
  @property --angle{
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes spin{
    from{ --angle: 0deg; }
    to{ --angle: 360deg; }
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
    background-image: conic-gradient(from var(--angle), #FFD700, #FFC700, #FFB700, #FFA700, #FFD700);
  }

  .gradient-border-silver::after, .gradient-border-silver::before {
    background-image: conic-gradient(from var(--angle), #c0c0c0, #e8e8e8, #a9a9a9, #d3d3d3, #f5f5f5, #c0c0c0);
  }

  .gradient-border-bronze::after, .gradient-border-bronze::before {
    background-image: conic-gradient(from var(--angle), #cd7f32, #b87333, #a57164, #b87333, #cd7f32);
  }
`;

const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

export default function HistoricalVideogamesPage() {
  const { editionId } = useParams<{ editionId: string }>();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTeamType, setActiveTeamType] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedPodiumTeam, setSelectedPodiumTeam] = useState<Team | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = glowStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (!editionId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [hTeamsData, editionData] = await Promise.all([
          fetchHistoricalTeamsWithScores(Number(editionId)),
          fetchEditionById(Number(editionId))
        ]);

        setEdition(editionData);

        const mappedTeams: Team[] = hTeamsData.map((t: any) => ({
          id: t.id,
          videogameId: t.videogame?.id || 0,
          gameName: t.videogame?.name || t.teamName,
          teamName: t.teamName,
          teamCode: t.teamCode || "",
          status: "CONFIRMADO",
          video: t.videogame?.videoUrl,
          repo: t.videogame?.repoUrl,
          members: (t.members || []).map((m: any) => `${m.firstName} ${m.lastName}`.trim()),
          description: t.videogame?.description || "Sin descripción disponible.",
          logo: t.videogame?.logoUrl,
          additionalImages: t.videogame?.additionalImages || [],
          isExternal: Boolean(t.isExternal),
          likes: t.videogame?.likes || 0,
          gameFileUrl: t.videogame?.gameFileUrl,
          entry: t.videogame?.entry,
          finalScore: t.videogame?.finalScore || null
        }));
        setTeams(mappedTeams);
      } catch (error) {
        console.error("Error loading historical teams with scores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [editionId]);

  // Separate podium and grid
  const { podium, restOfTeams } = useMemo(() => {
    const teamsWithScore = teams.filter((t: any) => t.finalScore !== null && t.finalScore > 0);
    const sorted = [...teamsWithScore].sort((a: any, b: any) => b.finalScore - a.finalScore);

    const top3 = sorted.slice(0, 3);
    const top3Ids = new Set(top3.map(t => t.id));

    const theRest = teams.filter(t => !top3Ids.has(t.id));

    return { podium: top3, restOfTeams: theRest };
  }, [teams]);

  // Filter grid teams
  const filteredTeams = useMemo(() => {
    return restOfTeams.filter((team) => {
      const matchesSearch =
        searchQuery === "" ||
        team.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.teamCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        activeTeamType === "all" ||
        (activeTeamType === "externo" && team.isExternal) ||
        (activeTeamType === "uninorte" && !team.isExternal);

      return matchesSearch && matchesType;
    });
  }, [restOfTeams, searchQuery, activeTeamType]);

  // Pagination for grid
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const currentTeams = filteredTeams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleFilter = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FondoArkad modo="lento" estiloNuevo />

      <NavBar />

      <main className="max-w-7xl mx-auto relative z-10 items-center p-4 pb-12 pt-24 text-white">
        {/* Navigation & Controls Row */}
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/ediciones-pasadas"
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1428] hover:bg-[#2A2438] border border-[#AC7CFF]/30 rounded-full transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium text-sm">Volver a Ediciones</span>
          </Link>
          <div className="flex items-center gap-4">
            <TextSizeControls />
            <DiscordButton discordUrl={discordSupportUrl} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center">
            Proyectos de la Edición{' '}
            <span className="text-[#AC7CFF] block md:inline mt-2 md:mt-0">
              {edition ? `${edition.year}-${edition.semester}` : ''}
            </span>
          </h1>
        </div>

        {loading ? (
          <TeamSkeletonGrid />
        ) : (
          <>
            {/* Podium Section */}
            {podium.length > 0 && (
              <section className="mb-20">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-3xl font-bold text-center text-white">Podio de la Edición</h2>
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>

                <div className="flex w-full max-w-4xl mx-auto items-end justify-center space-x-8">
                  {/* SECOND PLACE */}
                  {podium[1] && (
                    <motion.div whileHover={{ scale: 1.05 }} className="flex w-full flex-col items-center cursor-pointer" onClick={() => setSelectedPodiumTeam(podium[1])}>
                      <div className="mb-4 flex flex-col items-center">
                        <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-full border-4 border-[#c0c0c0] bg-gray-800 flex items-center justify-center">
                          {podium[1].logo ? (
                            <img src={podium[1].logo} alt={podium[1].gameName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-white">{podium[1].gameName.substring(0, 1)}</span>
                          )}
                        </div>
                        <p className="text-center text-lg font-semibold">{podium[1].gameName}</p>
                        <p className="text-center text-xl font-bold text-[#c0c0c0]">{podium[1].finalScore?.toFixed(2)}</p>
                      </div>
                      <div className="h-32 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-silver">
                        <div className="gradient-border-inner"></div>
                        <div className="flex h-full items-center justify-center relative z-10">
                          <span className="text-6xl font-bold text-white">2</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* FIRST PLACE */}
                  {podium[0] && (
                    <motion.div whileHover={{ scale: 1.05 }} className="flex w-full flex-col items-center cursor-pointer" onClick={() => setSelectedPodiumTeam(podium[0])}>
                      <div className="mb-4 flex flex-col items-center">
                        <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-full border-4 border-[#FFD700] bg-gray-800 flex items-center justify-center">
                          {podium[0].logo ? (
                            <img src={podium[0].logo} alt={podium[0].gameName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-white">{podium[0].gameName.substring(0, 1)}</span>
                          )}
                        </div>
                        <p className="text-center text-xl font-semibold">{podium[0].gameName}</p>
                        <p className="text-center text-2xl font-bold text-[#FFD700]">{podium[0].finalScore?.toFixed(2)}</p>
                      </div>
                      <div className="h-40 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-gold">
                        <div className="gradient-border-inner"></div>
                        <div className="flex h-full items-center justify-center relative z-10">
                          <span className="text-7xl font-bold text-white">1</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* THIRD PLACE */}
                  {podium[2] && (
                    <motion.div whileHover={{ scale: 1.05 }} className="flex w-full flex-col items-center cursor-pointer" onClick={() => setSelectedPodiumTeam(podium[2])}>
                      <div className="mb-4 flex flex-col items-center">
                        <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-[#CD7F32] bg-gray-800 flex items-center justify-center">
                          {podium[2].logo ? (
                            <img src={podium[2].logo} alt={podium[2].gameName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-white">{podium[2].gameName.substring(0, 1)}</span>
                          )}
                        </div>
                        <p className="text-center text-base font-semibold">{podium[2].gameName}</p>
                        <p className="text-center text-lg font-bold text-[#CD7F32]">{podium[2].finalScore?.toFixed(2)}</p>
                      </div>
                      <div className="h-24 w-full rounded-t-lg shadow-lg relative gradient-border gradient-border-bronze">
                        <div className="gradient-border-inner"></div>
                        <div className="flex h-full items-center justify-center relative z-10">
                          <span className="text-5xl font-bold text-white">3</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            )}

            {/* All Projects Section */}
            <section className="mt-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 md:mb-10 text-[#AC7CFF]">
                ¡Explora todos los proyectos!
              </h1>

              <Filters
                onFilter={handleFilter}
                initialFilter={searchQuery}
                activeTeamType={activeTeamType}
                setActiveTeamType={(type) => { setActiveTeamType(type); setCurrentPage(1); }}
                teamCounts={{
                  total: restOfTeams.length,
                  uninorte: restOfTeams.filter(t => !t.isExternal).length,
                  externo: restOfTeams.filter(t => t.isExternal).length
                }}
              />

              {currentTeams.length > 0 ? (
                <div className="mt-8">
                  <div className="grid grid-cols-1 min-[780px]:grid-cols-2 min-[1230px]:grid-cols-3 gap-6">
                    {currentTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        liveLikeCount={team.likes || 0}
                        onRefresh={() => { }}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-3 rounded-full bg-[#110D20] border border-[#AC7CFF]/30 text-[#AC7CFF] hover:bg-[#AC7CFF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <span className="text-gray-300 font-medium text-lg min-w-[120px] text-center">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-3 rounded-full bg-[#110D20] border border-[#AC7CFF]/30 text-[#AC7CFF] hover:bg-[#AC7CFF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 border border-dashed border-gray-800 rounded-xl mt-8">
                  <p className="text-gray-400 text-lg">
                    No se encontraron proyectos que coincidan con la búsqueda.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {selectedPodiumTeam && (
        <GameDetailModal
          team={selectedPodiumTeam}
          onClose={() => setSelectedPodiumTeam(null)}
          onRefresh={() => { }}
          liveCount={selectedPodiumTeam.likes || 0}
        />
      )}
    </div>
  );
}
