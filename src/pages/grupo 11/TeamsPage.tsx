"use client";
import { useState, useEffect } from "react";
import { Search, X, ExternalLink, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { useFetch } from "@/hooks/useFetch";
import { TeamSkeletonGrid } from "@/components/grupo 5/TeamSkeleton";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { DiscordButton } from "@/components/grupo 5/DiscordButton";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";

export type TeamStatus = "pendiente" | "confirmado" | "expirado";

export interface Team {
  id: number;
  gameName: string;
  teamName: string;
  teamCode: string;
  userId: string;
  status: TeamStatus;
  video?: string;
  repo?: string;
  members?: string[];
  description?: string;
  logo?: string;
  additionalImages?: string[];
  isExternal?: boolean;
}

export default function TeamsPage() {
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
  const discordSupportUrl = "https://discord.gg/RzAvUdspaT";

  // Función para mapear estados numéricos o strings a los valores correctos
  const mapStatusToString = (status: any): string => {
    if (typeof status === 'number') {
      switch (status) {
        case 1: return "pendiente";
        case 2: return "confirmado";
        case 3: return "expirado";
        default: return "pendiente";
      }
    }
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      
      // Mapeo específico para diferentes strings que puede enviar el backend
      switch (lowerStatus) {
        case "pendiente":
        case "pending":
          return "pendiente";
        case "confirmado":
        case "confirmed":
        case "aprobado":
        case "approved":
          return "confirmado";
        case "expirado":
        case "expired":
        case "rechazado":
        case "rejected":
          return "expirado";
        default:
          return "pendiente";
      }
    }
    return "pendiente"; // fallback por defecto
  };

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      
      try {
        // Intentar obtener equipos desde el endpoint de teams primero
        let rawData = [];
        let videogamesData = [];
        
        try {
          const teamsRes = await customFetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
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
              `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`,
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
                  confirmId: teamInfo?.confirmId || videogame.status
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
          
          // Determinar el estado del equipo
          const statusField = team.confirmId || team.status || videogame.status;
          const mappedStatus = mapStatusToString(statusField);
          
          // Obtener integrantes que ya vienen incluidos en los datos del equipo
          const teamMembers = team.members || [];
          
          // Debug temporal: verificar estructura de los datos  
          if (team.id === 1) {
            console.log("🔍 Estructura completa del team:", team);
            console.log("🔍 Miembros del equipo:", teamMembers);
          }
          
          // Usar el campo isExternal del backend (campo 'isExternal' o 'externo' de la tabla equipos)
          const isExternal = Boolean(team.isExternal || team.externo);
          
          return {
            id: team.id,
            gameName: videogame.name || team.teamName || "Sin nombre",
            teamName: team.teamName || "Sin equipo", 
            status: mappedStatus as TeamStatus || "pendiente",
            video: videogame.videoUrl || videogame.video_url,
            repo: videogame.repoUrl || videogame.repo_url,
            members: teamMembers.map((m: any) => {
              // Probar diferentes nombres de campos para nombre y apellido
              const firstName = m.firstName || m.nombre || m.first_name || '';
              const lastName = m.lastName || m.apellido || m.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              
              // Debug para el primer miembro del primer equipo
              if (team.id === 1 && teamMembers.indexOf(m) === 0) {
                console.log("🔍 Estructura del primer miembro:", m);
                console.log("🔍 Nombre completo construido:", fullName);
              }
              
              return fullName || 'Sin nombre';
            }),
            description: videogame.descripcion || videogame.description || "Sin descripción disponible.",
            logo: videogame.logoUrl || videogame.logo_url,
            additionalImages: videogame.additionalImages || fallbackImages,
            isExternal: isExternal,
          };
        });
        
        // Filtrar equipos rechazados - solo mostrar pendientes y confirmados
        const teamsToShow = data.filter(team => team.status !== "expirado");
        
        setTeams(teamsToShow);
      } catch (error) {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    
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
  });

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
              className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                activeTeamType === "all" 
                  ? "bg-[#AC7CFF] text-[#060312] border-2 border-[#AC7CFF] shadow-lg" 
                  : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              Todos ({teams.length})
            </button>
            <button
              onClick={() => setActiveTeamType("uninorte")}
              className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                activeTeamType === "uninorte" 
                  ? "bg-blue-500/20 text-blue-300 border border-blue-400 shadow-lg" 
                  : "text-gray-300 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              Uninorte ({teams.filter(t => !t.isExternal).length})
            </button>
            <button
              onClick={() => setActiveTeamType("externo")}
              className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                activeTeamType === "externo" 
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
                <TeamCard key={team.id} team={team} />
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

interface FiltersProps {
  onFilter: (value: string) => void;
  initialFilter: string;
}

function Filters({ onFilter, initialFilter }: FiltersProps) {
  const [filterText, setFilterText] = useState(initialFilter);

  return (
    <div className="flex justify-center items-center mb-10 gap-2">
      <div className="relative">
        <Search className="absolute z-10 w-4 left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Busca por nombre de equipo o videojuego"
          className="w-64 md:w-96 pl-10"
        />
      </div>
      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={() => onFilter(filterText)}
      >
        Buscar
      </Button>
    </div>
  );
}

interface TeamCardProps {
  team: Team;
}

function TeamCard({ team }: TeamCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusInfo = (status: TeamStatus) => {
    switch (status) {
      case "pendiente":
        return { text: "Pendiente de confirmación", color: "text-purple-400" };
      case "confirmado":
        return { text: "Inscripción completa", color: "text-blue-400" };
      case "expirado":
        return { text: "Rechazada", color: "text-red-400" };
      default:
        return { text: "Estado desconocido", color: "text-gray-400" };
    }
  };

  const { text, color } = getStatusInfo(team.status);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
      >
        <Card className="relative transition-all duration-300 hover:shadow-xl hover:border-[#AC7CFF]/50 h-40">
          {/* Badge de tipo de equipo */}
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
            !team.isExternal
              ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
              : "bg-green-500/20 text-green-300 border border-green-400/30"
          }`}>
            {!team.isExternal ? "Uninorte" : "Externo"}
          </div>
          
          <CardContent className="flex space-x-5 py-6 px-8 h-full">
            <div className="flex items-center">
              <Avatar className="w-20 h-20 border-2 border-[#AC7CFF]/30 flex-shrink-0">
                <AvatarImage
                  src={team.logo}
                  alt={`${team.teamName} logo`}
                  className="object-cover rounded-full"
                />
                <AvatarFallback className="bg-gradient-to-br from-[#AC7CFF] to-[#7C3AED] text-white font-bold text-2xl">
                  {team.gameName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col justify-center space-y-1 flex-1 pr-16">
              <h4 className="text-xl font-medium">{team.gameName}</h4>
              <p>Equipo: {team.teamName}</p>
              <p className={`${color} font-semibold`}>{text}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {isOpen && (
        <GameDetailModal team={team} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

interface MediaCarouselProps {
  video?: string;
  images: string[]; // Solo imágenes adicionales, NO incluye el logo
  gameImage?: string; // Solo para thumbnail del video
}

// Función para extraer miniatura automáticamente de la URL del video
const getVideoThumbnail = (videoUrl: string): string => {
  try {
    // YouTube - extraer ID del video y generar URL de miniatura
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    
    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      // Usar miniatura de alta calidad de YouTube
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    // Para otros servicios de video, usar placeholder
    return '/placeholder.svg';
  } catch (error) {
    return '/placeholder.svg';
  }
};

function MediaCarousel({ video, images }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Crear array con todos los elementos multimedia (solo video e imágenes adicionales, NO el logo)
  const mediaItems = [];
  
  // Agregar video como primer elemento si existe
  if (video) {
    const autoThumbnail = getVideoThumbnail(video);
    mediaItems.push({ 
      type: 'video', 
      src: video, 
      thumbnail: autoThumbnail
    });
  }
  
  // Agregar SOLO las imágenes adicionales (no incluir el logo)
  images.forEach((image) => {
    if (image && image.trim() !== '') {
      mediaItems.push({ type: 'image', src: image });
    }
  });

  // Si no hay elementos, mostrar placeholder
  if (mediaItems.length === 0) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden max-h-[550px] bg-gray-800 flex items-center justify-center">
        <p className="text-gray-400 text-center px-4">
          Sin multimedia disponible<br />
          <span className="text-sm opacity-75">Sube un video o imágenes adicionales</span>
        </p>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative w-full">
      {/* Contenido principal del carrusel */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden max-h-[550px]">
        {currentItem.type === 'video' ? (
          <ReactPlayer
            src={currentItem.src}
            width="100%"
            height="100%"
            controls
          />
        ) : (
          <img
            src={currentItem.src}
            alt="Imagen del juego"
            className="w-full h-full object-cover"
          />
        )}

        {/* Controles del carrusel (solo si hay más de un elemento y solo en desktop) */}
        {mediaItems.length > 1 && (
          <>
            {/* Botón anterior - Solo visible en desktop */}
            <button
              onClick={prevSlide}
              className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Botón siguiente - Solo visible en desktop */}
            <button
              onClick={nextSlide}
              className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Barra de miniaturas (solo si hay más de un elemento) */}
      {mediaItems.length > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 max-w-full px-4 py-2">
            {mediaItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-24 h-18 rounded-md overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-[#AC7CFF] ring-offset-2 ring-offset-gray-800'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full">
                    <img
                      src={item.thumbnail || '/placeholder.svg'}
                      alt={`Video miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-4 border-l-black border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GameDetailModalProps {
  team: Team;
  onClose: () => void;
}

function GameDetailModal({ team, onClose }: GameDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4 pb-1 md:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-[#181a20] text-white rounded-2xl overflow-hidden w-[95%] max-w-5xl h-[85vh] md:h-[600px] max-h-[85vh] md:max-h-[600px] shadow-[0_0_30px_rgba(172,124,255,0.25)] border border-[#AC7CFF]/30 flex flex-col md:flex-row"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        >
          {/* Botón X de cerrar - Oculto en móvil */}
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 🎬 Carrusel de Video e Imágenes Adicionales (NO incluye el logo) */}
          <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-3 flex-shrink-0">
            <MediaCarousel 
              video={team.video} 
              images={team.additionalImages || []} 
            />
          </div>

          {/* 🧾 Información del equipo */}
          <div className="w-full md:w-1/3 flex flex-col min-h-0 bg-gradient-to-b from-[#1b1f2a] to-[#141720]">
            <div className="p-4 pt-4 md:p-6 md:pt-6 overflow-y-auto flex-1
              [&::-webkit-scrollbar]:w-2 pr-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-800
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#AC7CFF]/50
              [&::-webkit-scrollbar-thumb:hover]:bg-[#AC7CFF]">
              
              <div className="space-y-4">
                <div className="flex justify-center mb-2 md:mb-4">
                  <div className="w-28 h-28 rounded-full border-3 border-[#AC7CFF]/40 overflow-hidden bg-white/10 p-1 flex items-center justify-center">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={`${team.teamName} logo`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#AC7CFF] to-[#7C3AED] flex items-center justify-center">
                        <span className="text-white font-bold text-4xl">
                          {team.gameName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-[#AC7CFF] mb-4">
                  {team.gameName}
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  Equipo:{" "}
                  <span className="text-white font-semibold">
                    {team.teamName}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Estado:{" "}
                  <span className="capitalize text-gray-200">{team.status}</span>
                </p>
                
                <div className="mt-2">
                  <h3 className="text-lg font-semibold text-[#AC7CFF] mb-2">Descripción</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    {team.description || "Sin descripción disponible."}
                  </p>
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-[#AC7CFF]" />
                      <h4 className="text-lg font-semibold">Integrantes</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      {team.members.map((member, index) => (
                        <li key={index}>{member}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 🔗 Botones */}
                <div className="flex flex-col items-center gap-3 mt-8 pb-4 pr-4">
                  {team.repo && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(team.repo, "_blank")}
                      className="w-full flex items-center justify-center gap-2 border-[#AC7CFF]/40 text-gray-200 hover:bg-[#AC7CFF]/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver repositorio en GitHub
                    </Button>
                  )}
                  
                  {/* Botón Cerrar - Solo visible en móvil */}
                  <button
                    onClick={onClose}
                    className="md:hidden w-full py-2 px-3 rounded-lg font-medium text-sm bg-[#541ab8] text-white transition-all duration-300 ease-in-out hover:bg-[#6B2FCC]"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}