"use client";
import { useState, useEffect, useMemo } from "react";
import NavBar from "@/components/grupo 5/NavBar";
import { useFetch } from "@/hooks/useFetch";
import { TeamSkeletonGrid } from "@/components/grupo 5/TeamSkeleton";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { useLikesSocket } from "@/hooks/useLikesSocket";
import { Team, TeamStatus } from "@/types/Team";
import { TeamCard } from "@/components/videogamePage/TeamCard";
import { Filters } from "@/components/videogamePage/Filters";

export default function VideogamesPage() {
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTeamType, setActiveTeamType] = useState<string>("all");
  const customFetch = useFetch();

  // Initial REST snapshot - syncs only the first time it loads
  const initialLikes = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.videogameId, t.likes ?? 0])),
    [teams],
  );
  const liveLikes = useLikesSocket(initialLikes);
  const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

  // Función para mapear estados numéricos o strings a los valores correctos
  const mapStatusToString = (status: any): TeamStatus => {
    if (typeof status === 'number') {
      switch (status) {
        case 1: return "CONFIRMADO";
        case 2: return "PENDIENTE";
        case 3: return "RECHAZADO";
        default: return "PENDIENTE";
      }
    }
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();

      // Mapeo específico para diferentes strings que puede enviar el backend
      switch (lowerStatus) {
        case "pendiente":
        case "pending":
          return "PENDIENTE";
        case "confirmado":
        case "confirmed":
        case "aprobado":
        case "approved":
          return "CONFIRMADO";
        case "rechazado":
        case "expired":
        case "rejected":
          return "RECHAZADO";
        default:
          return "PENDIENTE";
      }
    }
    return "PENDIENTE"; // fallback por defecto
  };

  const fetchTeams = async () => {
    setLoading(true);

    try {
      // Intentar obtener equipos desde el endpoint de teams primero
      let rawData = [];
      let videogamesData = [];

      try {
        const teamsRes = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams?sortByLikes=true`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (teamsRes.ok) {
          rawData = await teamsRes.json();
        } else {
          throw new Error(`Teams endpoint failed: ${teamsRes.status}`);
        }
      } catch (teamsError) {

        // Fallback: obtener desde videogames y luego equipos por separado
        const videogamesRes = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/videogames`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        videogamesData = await videogamesRes.json();

        // Ahora intentamos obtener información de equipos para el campo isExternal
        try {
          const teamsInfoRes = await customFetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams?sortByLikes=true`,
            {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (teamsInfoRes.ok) {
            const teamsInfo = await teamsInfoRes.json();

            // Mapear videogames con información de equipos
            rawData = videogamesData.map((videogame: any) => {
              const teamInfo = teamsInfo.find((t: any) => t.id === videogame.teamId || t.videogame?.id === videogame.id);
              return {
                ...videogame,
                isExternal: teamInfo?.isExternal || teamInfo?.externo || false,
                teamName: teamInfo?.teamName || "Sin equipo",
              };
            });
          } else {
            // Si tampoco funciona, usar solo datos de videogames sin isExternal
            rawData = videogamesData.map((videogame: any) => ({
              ...videogame,
              isExternal: false, // fallback
              teamName: "Sin equipo"
            }));
          }
        } catch (teamInfoError) {
          rawData = videogamesData.map((videogame: any) => ({
            ...videogame,
            isExternal: false,
            teamName: "Sin equipo"
          }));
        }
      }

      // Los miembros ya vienen incluidos en los datos de teams desde el backend

      const data: Team[] = rawData.map((item: any) => {
        // FALLBACK: Imágenes de ejemplo para equipos de prueba (cuando no hay additionalImages del backend)
        let fallbackImages: string[] = [];

        // Determinar si los datos vienen del endpoint de teams o videogames
        const isFromTeamsEndpoint = item.videogame !== undefined;
        const team = isFromTeamsEndpoint ? item : item;
        const videogame = isFromTeamsEndpoint ? item.videogame || {} : item;
        // Likes come from the relation count (_count.likedBy) — no denormalized field
        const likeCount = videogame._count?.likedBy ?? 0;

        // Determinar el estado del equipo
        const statusField = team.videogame?.videogameStatusId || videogamesData.find((vg: any) => vg.teamId === team.id)?.videogameStatusId;
        const mappedStatus = mapStatusToString(statusField);

        // Obtener integrantes que ya vienen incluidos en los datos del equipo
        const teamMembers = team.members || [];

        // Usar el campo isExternal del backend (campo 'isExternal' o 'externo' de la tabla equipos)
        const isExternal = Boolean(team.isExternal || team.externo);

        const resolvedVideogameId = videogame.id ?? item.id;

        return {
          id: team.id,
          videogameId: resolvedVideogameId,
          gameName: videogame.name || team.teamName || "Sin nombre",
          teamName: team.teamName || "Sin equipo",
          status: mappedStatus,
          video: videogame.videoUrl || videogame.video_url,
          repo: videogame.repoUrl || videogame.repo_url,
          teamCode: team.teamCode || team.code || "",
          members: teamMembers.map((m: any) => {
            const firstName = m.firstName || m.nombre || m.first_name || '';
            const lastName = m.lastName || m.apellido || m.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();

            return fullName || 'Sin nombre';
          }),
          description: videogame.descripcion || videogame.description || "Sin descripción disponible.",
          logo: videogame.logoUrl || videogame.logo_url,
          additionalImages: videogame.additionalImages || fallbackImages,
          isExternal: isExternal,
          likes: likeCount || 0,
        };
      });

      // Filtrar equipos rechazados - solo mostrar pendientes y confirmados
      const teamsToShow = data.filter(team => team.status !== "RECHAZADO");

      setTeams(teamsToShow);
    } catch (error) {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) => {
    // Filtro de búsqueda por nombre
    const matchesSearch = team.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro por tipo de equipo basado en isExternal
    const matchesType = activeTeamType === "all" ? true :
      (activeTeamType === "externo" ? team.isExternal === true : team.isExternal === false);

    return matchesSearch && matchesType;
  }).sort((a, b) => (b.likes || 0) - (a.likes || 0)); // Ordenar por likes descendente

  const handleFilter = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="relative min-h-screen bg-[#0d0f14] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-float"
        style={{ backgroundImage: "url('/background.webp')" }}
      >
        <div className="absolute inset-0"></div>
      </div>
      <NavBar />
      <div className=" max-w-7xl mx-auto relative z-10 items-center p-4 pb-12 pt-30 text-white">
        <h1 className="text-4xl font-bold text-center mb-10 text-[#AC7CFF]">
          ¡Echa un vistazo a los videojuegos participantes!
        </h1>

        {/* Filtros de tipo de equipo */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-3 p-2 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTeamType("all")}
              className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium ${activeTeamType === "all"
                ? "bg-[#AC7CFF] text-[#060312] border-2 border-[#AC7CFF] shadow-lg"
                : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                }`}
            >
              Todos ({teams.length})
            </button>
            <button
              onClick={() => setActiveTeamType("uninorte")}
              className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium ${activeTeamType === "uninorte"
                ? "bg-blue-500/20 text-blue-300 border border-blue-400 shadow-lg"
                : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                }`}
            >
              Uninorte ({teams.filter(t => !t.isExternal).length})
            </button>
            <button
              onClick={() => setActiveTeamType("externo")}
              className={`cursor-pointer px-4 py-2 rounded-xl transition-all text-sm font-medium ${activeTeamType === "externo"
                ? "bg-green-500/20 text-green-300 border border-green-400 shadow-lg"
                : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
                }`}
            >
              Externos ({teams.filter(t => t.isExternal).length})
            </button>
          </div>
        </div>

        <Filters onFilter={handleFilter} initialFilter={searchQuery} />

        <div className="relative">
          {loading ? (
            <TeamSkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onRefresh={fetchTeams}
                  liveLikeCount={liveLikes[team.videogameId] ?? team.likes ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <TextSizeControls />
      <DiscordButton discordUrl={discordSupportUrl} />
    </div>
  );
}

